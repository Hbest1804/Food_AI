import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Initialize Gemini SDK with telemetry header per skill instructions
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export const apiApp = express();
apiApp.use(express.json({ limit: '10mb' }));

// API Health check
apiApp.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Chatbot API Endpoint (Guest mode or Full Personalized mode)
apiApp.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      tasteProfile,
      isGuest = false,
      fridgeIngredients = [],
      activeDishContext,
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ' });
      return;
    }

    // If Gemini client is available, use real model
    if (ai) {
      let systemInstruction = '';
      if (isGuest) {
        systemInstruction = `Bạn là Trợ lý Ẩm thực Thông minh CulinaAI đang phục vụ người dùng ở Chế độ Khách (Guest Mode).
- Vai trò: Đầu bếp ảo nhiệt tình, am hiểu ẩm thực đa quốc gia (đặc biệt là món Việt, Á, Âu, Eat Clean).
- Giới hạn: Đây là chế độ khách. Trả lời súc tích (150-250 từ), cung cấp cảm hứng nấu ăn, công thức tổng quan hoặc mẹo chế biến ngon.
- Nhắc nhở: Lồng ghép nhẹ nhàng ở cuối câu rằng người dùng có thể Đăng ký / Đăng nhập để AI ghi nhớ hồ sơ dị ứng, calo mục tiêu, khẩu vị riêng và tra cứu tủ lạnh cá nhân hóa hoàn toàn.
- Ngôn ngữ: Tiếng Việt tự nhiên, ấm áp, văn phong ẩm thực hấp dẫn.`;
      } else {
        const profileSummary = tasteProfile
          ? `
HỒ SƠ KHẨU VỊ CÁ NHÂN CỦA KHÁCH HÀNG:
- Tên người dùng: ${tasteProfile.name || 'Bạn'}
- Chế độ ăn uống: ${tasteProfile.diet || 'Bình thường'}
- Dị ứng thực phẩm (BẮT BUỘC TRÁNH TUYỆT ĐỐI): ${
              tasteProfile.allergies?.length ? tasteProfile.allergies.join(', ') : 'Không có'
            }
- Món/Gia vị kiêng hoặc ghét: ${
              tasteProfile.dislikes?.length ? tasteProfile.dislikes.join(', ') : 'Không có'
            }
- Mức độ ăn cay ưa thích: ${tasteProfile.spiceTolerance || 'Vừa phải'}
- Mục tiêu calo mỗi ngày: ${tasteProfile.targetCalories || 1800} kcal
- Mục tiêu thể trạng: ${tasteProfile.healthGoal || 'Duy trì sức khỏe và ăn ngon'}
- Ẩm thực yêu thích: ${
              tasteProfile.favoriteCuisines?.length
                ? tasteProfile.favoriteCuisines.join(', ')
                : 'Món Việt, Món Á'
            }`
          : 'Người dùng đã đăng nhập (chưa cập nhật chi tiết hồ sơ).';

        systemInstruction = `Bạn là Chuyên gia Dinh dưỡng & Bếp trưởng Cá nhân CulinaAI hàng đầu.
Bạn đang trò chuyện với người dùng VIP đã đăng nhập. Bạn phải tuân thủ nghiêm ngặt hồ sơ khẩu vị sau:
${profileSummary}

${
  fridgeIngredients && fridgeIngredients.length > 0
    ? `NGUYÊN LIỆU TRONG TỦ LẠNH HIỆN CÓ: ${fridgeIngredients.join(', ')}. Hãy ưu tiên tối đa việc kết hợp các nguyên liệu này để giảm lãng phí.`
    : ''
}
${
  activeDishContext
    ? `MÓN ĂN NGƯỜI DÙNG ĐANG XEM: ${activeDishContext.name} (${activeDishContext.cuisine}, ${activeDishContext.calories} kcal). Sẵn sàng giải thích thêm về cách nấu, mẹo canh lửa hoặc biến tấu.`
    : ''
}

QUY TẮC BẮT BUỘC:
1. AN TOÀN TUYỆT ĐỐI: Không bao giờ đề xuất bất kỳ món ăn hay gia vị nào chứa chất gây dị ứng đã liệt kê ở trên. Nếu người dùng hỏi món có thành phần dị ứng, hãy cảnh báo ngay và đề xuất phương án thay thế an toàn.
2. CÁ NHÂN HÓA: Phù hợp với chế độ ăn (${tasteProfile?.diet || 'Bình thường'}) và mục tiêu calo (${tasteProfile?.targetCalories || 1800} kcal).
3. ĐẦY ĐỦ VÀ THỰC TẾ: Nêu rõ nguyên liệu, định lượng, các bước nấu ngắn gọn và mẹo nấu ngon bí truyền.
4. Trình bày đẹp mắt bằng Markdown, dùng bullet point, in đậm rõ ràng.`;
      }

      // Format conversation contents for generateContent
      const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      // Include recent history (up to last 6 messages)
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        formattedContents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.content || item.text || '' }],
        });
      }

      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      const replyText = response.text || 'Xin lỗi, tôi chưa thể trả lời lúc này.';
      res.json({ reply: replyText });
      return;
    }

    // Smart fallback when GEMINI_API_KEY is not configured
    const fallbackReply = generateFallbackChatResponse(message, tasteProfile, isGuest, fridgeIngredients);
    res.json({ reply: fallbackReply });
  } catch (err: unknown) {
    console.error('Lỗi khi gọi chatbot:', err);
    const fallback = generateFallbackChatResponse(
      req.body?.message || '',
      req.body?.tasteProfile,
      req.body?.isGuest,
      req.body?.fridgeIngredients
    );
    res.json({ reply: fallback });
  }
});

// AI Personalized Recommendation Reasoner
apiApp.post('/api/recommend', async (req: Request, res: Response) => {
  try {
    const { tasteProfile, mealTime = 'Tối' } = req.body;

    if (ai && tasteProfile) {
      const prompt = `Dựa trên hồ sơ khẩu vị của người dùng:
- Chế độ ăn: ${tasteProfile.diet}
- Dị ứng: ${tasteProfile.allergies?.join(', ') || 'Không'}
- Món kiêng: ${tasteProfile.dislikes?.join(', ') || 'Không'}
- Calo mục tiêu: ${tasteProfile.targetCalories} kcal
- Ẩm thực thích: ${tasteProfile.favoriteCuisines?.join(', ')}
- Bữa ăn: ${mealTime}

Hãy đưa ra lời khuyên dinh dưỡng ngắn (2-3 câu) giải thích tại sao thực đơn hôm nay phù hợp nhất với họ, và gợi ý 1 mẹo ẩm thực giúp tối ưu năng lượng.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({
        analysis: response.text || 'Thực đơn được cân đối tối ưu cho khẩu vị và mục tiêu calo của bạn.',
      });
      return;
    }

    res.json({
      analysis: `Dựa trên chế độ ${tasteProfile?.diet || 'lành mạnh'} và mục tiêu ${tasteProfile?.targetCalories || 1800} kcal, thực đơn này giúp bạn nạp đủ protein, hạn chế chất béo bão hòa và giữ năng lượng bền bỉ suốt ngày dài.`,
    });
  } catch (err) {
    console.error('Lỗi gợi ý:', err);
    res.json({
      analysis: 'Thực đơn được cá nhân hóa nhằm đáp ứng tốt nhất mục tiêu dinh dưỡng và khẩu vị riêng của bạn.',
    });
  }
});

// Helper fallback engine in case of offline or no key
export function generateFallbackChatResponse(
  message: string,
  tasteProfile: any,
  isGuest: boolean,
  fridgeIngredients: string[] = []
): string {
  const msgLower = message.toLowerCase();

  if (fridgeIngredients.length > 0 && (msgLower.includes('tủ lạnh') || msgLower.includes('nguyên liệu'))) {
    return `🍽️ **Gợi ý từ tủ lạnh (${fridgeIngredients.join(', ')}):**\n\nBạn có thể làm ngay món **Xào thập cẩm nhanh gọn** hoặc **Canh thanh mát**:\n- **Bước 1**: Sơ chế và thái vừa ăn các nguyên liệu ${fridgeIngredients.slice(0, 3).join(', ')}.\n- **Bước 2**: Phi thơm tỏi với 1 thìa dầu ô liu nhỏ, cho các nguyên liệu chín lâu vào trước.\n- **Bước 3**: Nêm 1 thìa nước tương, chút hạt tiêu và đảo đều tay trong 5-7 phút.\n\n*Món này tốn chưa tới 15 phút, giàu dinh dưỡng và hoàn toàn không lãng phí thức ăn thừa!*`;
  }

  if (msgLower.includes('giảm cân') || msgLower.includes('calo') || msgLower.includes('eat clean')) {
    return `🥗 **Tư vấn dinh dưỡng Eat Clean & Giảm mỡ:**\n\nĐể đạt hiệu quả tốt nhất:\n1. **Ưu tiên Protein nạc**: Ức gà áp chảo, cá hồi áp chảo, trứng luộc, đậu hũ non.\n2. **Tinh bột chậm**: Gạo lứt, khoai lang nướng, yến mạch.\n3. **Mẹo no lâu**: Uống một ly nước ấm 15 phút trước bữa ăn và bắt đầu bữa ăn bằng rau xanh.\n\n${
      isGuest
        ? '\n💡 *Mẹo: Hãy đăng nhập để CulinaAI tự động tính toán chính xác macro và calo theo cân nặng của riêng bạn.*'
        : `\n✨ Phù hợp với mục tiêu ${tasteProfile?.targetCalories || 1800} kcal của bạn!`
    }`;
  }

  if (msgLower.includes('món việt') || msgLower.includes('phở') || msgLower.includes('cơm')) {
    return `🍲 **Tinh hoa Ẩm thực Việt Nam:**\n\nẨm thực Việt nổi tiếng thế giới nhờ sự cân bằng âm dương và rau thơm thảo mộc. Bạn có thể thử:\n- **Canh chua cá lóc miền Tây**: Vị chua thanh từ me/thơm, giòn rụm của bạc hà và giá đỗ.\n- **Gà xào sả ớt**: Đậm đà, thơm lừng mùi sả non và ấm bụng ngày mưa.\n- **Gỏi cuốn tôm thịt**: Thanh mát, ít dầu mỡ, ăn kèm nước chấm tương đen bùi ngậy.\n\nBạn muốn tôi hướng dẫn chi tiết công thức nào trên đây?`;
  }

  if (isGuest) {
    return `Chào bạn! Tôi là **CulinaAI - Trợ lý Ẩm thực Thông minh** 👨‍🍳\n\nTôi có thể giúp bạn tìm công thức nấu ăn, giải đáp mẹo làm bếp, gợi ý bữa tối từ nguyên liệu có sẵn hay phân tích calo món ăn.\n\n📌 *Lưu ý: Bạn đang ở chế độ khách vãng lai. Hãy Đăng ký hoặc Đăng nhập để mở khóa tính năng lưu khẩu vị riêng, cảnh báo dị ứng tuyệt đối và nhận thực đơn cá nhân hóa mỗi ngày nhé!*`;
  }

  return `Chào ${tasteProfile?.name || 'bạn'}! Tôi đã sẵn sàng hỗ trợ bạn theo chế độ **${tasteProfile?.diet || 'cá nhân hóa'}**.\n\nHôm nay bạn muốn nấu món gì, hay cần tôi gợi ý bữa ăn ngon miệng dựa trên khẩu vị và nguyên liệu bạn đang có sẵn?`;
}
