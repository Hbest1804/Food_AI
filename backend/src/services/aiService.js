// src/services/aiService.js
// Dịch vụ tích hợp Gemini AI cho CulinaAI chatbot

import { env } from '../config/appConfig.js';

class AIServiceError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Phân tích và sinh câu trả lời cho Chatbot AI ẩm thực.
 * @param {Object} params
 * @param {string} params.content Nội dung câu hỏi của người dùng
 * @param {Object} [params.fridge] Danh sách nguyên liệu trong tủ lạnh
 * @param {Array} [params.dishesContext] Món ăn trong CSDL liên quan
 * @returns {Promise<{ type: 'recipe'|'general'|'out_of_scope', content: string, dishes: Array }>}
 */
export async function generateCulinaryReply({ content, fridge = {}, dishesContext = [] }) {
  if (!env.gemini.apiKey) {
    // Chế độ mô phỏng khi chưa có API key
    return fallbackResponse(content, dishesContext, fridge);
  }

  const prompt = buildGeminiPrompt({ content, fridge, dishesContext });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent?key=${env.gemini.apiKey}`;

  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 giây timeout theo spec 504

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
          },
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AIServiceError('AI_TIMEOUT', 'Dịch vụ AI quá thời gian chờ phản hồi (15s). Vui lòng thử lại sau.', 504);
    }
    throw new AIServiceError('AI_SERVICE_ERROR', `Lỗi kết nối tới dịch vụ AI: ${err.message}`, 502);
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API Error:', response.status, errText);
    throw new AIServiceError('AI_SERVICE_ERROR', 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại.', 502);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new AIServiceError('AI_SERVICE_ERROR', 'Mô hình AI không trả về nội dung.', 502);
  }

  return parseGeminiResponse(rawText, dishesContext);
}

/**
 * Xây dựng prompt có cấu trúc cho Gemini
 */
function buildGeminiPrompt({ content, fridge, dishesContext }) {
  const dishesSummary = dishesContext.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    cook_time_minutes: d.cook_time_minutes,
    difficulty: d.difficulty,
    image_url: d.image_url,
  }));

  const fridgeInfo = [];
  if (fridge?.ingredient_names?.length) {
    fridgeInfo.push(`Nguyên liệu trong danh mục: ${fridge.ingredient_names.join(', ')}`);
  }
  if (fridge?.custom_ingredients?.length) {
    fridgeInfo.push(`Nguyên liệu nhập tay: ${fridge.custom_ingredients.join(', ')}`);
  }

  return `Bạn là "CulinaAI" - Trợ lý ẩm thực Việt Nam tinh hoa và thân thiện.
Nhiệm vụ của bạn là tư vấn ẩm thực, công thức nấu ăn, mẹo làm bếp, giá trị dinh dưỡng, và sáng tạo món ăn ngon từ nguyên liệu người dùng có.

NGUYÊN TẮC QUAN TRỌNG:
1. NẾU CÂU HỎI HOÀN TOÀN KHÔNG LIÊN QUAN ĐẾN ẨM THỰC / ĂN UỐNG / NẤU NƯỚNG / DINH DƯỠNG (ví dụ hỏi về lập trình, toán học, chính trị, thời tiết, giải trí...):
   - Hãy từ chối lịch sự và hướng người dùng trở lại chủ đề ẩm thực.
   - Trả lời theo định dạng JSON với "type": "out_of_scope".

2. NẾU CÂU HỎI VỀ ẨM THỰC:
   - Hãy trả lời nhiệt tình, rõ ràng, định dạng văn bản Markdown đẹp mắt (gạch đầu dòng, nhấn mạnh...).
   - Nếu có các món ăn trong kho dữ liệu hệ thống dưới đây phù hợp với câu hỏi hoặc nguyên liệu, hãy đề xuất và liệt kê id của món đó trong mảng "matched_dish_ids":
     ${JSON.stringify(dishesSummary, null, 2)}
   - Nếu người dùng có nguyên liệu trong tủ lạnh:
     ${fridgeInfo.length ? fridgeInfo.join('\n') : '(Không có)'}
     Hãy ưu tiên sáng tạo món hoặc tìm công thức tận dụng tối đa các nguyên liệu này!

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm theo bất kỳ văn bản nào bên ngoài cặp ngoặc nhọn), theo cấu trúc:
{
  "type": "recipe" hoặc "general" hoặc "out_of_scope",
  "content": "Nội dung trả lời chi tiết bằng tiếng Việt, định dạng markdown",
  "matched_dish_ids": ["uuid-mon-an-1", "uuid-mon-an-2"]
}

Câu hỏi của người dùng:
"${content}"`;
}

/**
 * Phân tích JSON trả về từ Gemini và liên kết món ăn
 */
function parseGeminiResponse(rawText, dishesContext) {
  let cleaned = rawText.trim();
  // Bỏ markdown json code block nếu có
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Nếu Gemini trả về text thường không đúng JSON hoàn hảo
    const isOut = /(không|chưa) liên quan.*ẩm thực|chỉ hỗ trợ.*nấu ăn/i.test(cleaned);
    return {
      type: isOut ? 'out_of_scope' : 'general',
      content: cleaned,
      dishes: [],
    };
  }

  const type = ['recipe', 'general', 'out_of_scope'].includes(parsed.type)
    ? parsed.type
    : 'general';

  // Lọc danh sách món khớp
  const matchedIds = Array.isArray(parsed.matched_dish_ids) ? parsed.matched_dish_ids : [];
  const dishes = dishesContext.filter((d) => matchedIds.includes(d.id));

  return {
    type,
    content: parsed.content || 'Dạ, em rất vui được đồng hành cùng bạn nấu ăn ngon!',
    dishes,
  };
}

/**
 * Fallback khi không có API key
 */
function fallbackResponse(content, dishesContext, fridge) {
  const c = content.toLowerCase();
  const isCooking = /(nấu|món|canh|kho|xào|nướng|thịt|cá|rau|trứng|ăn gì|bữa|calo|công thức|tủ lạnh)/i.test(c);

  if (!isCooking) {
    return {
      type: 'out_of_scope',
      content: 'Dạ em là trợ lý ẩm thực CulinaAI, em chỉ có thể hỗ trợ các câu hỏi liên quan đến ẩm thực, món ăn, công thức nấu nướng và dinh dưỡng thôi ạ. Bạn có muốn tìm gợi ý món ngon nào không?',
      dishes: [],
    };
  }

  const sampleDishes = dishesContext.slice(0, 2);
  const dishNames = sampleDishes.map((d) => `**${d.name}**`).join(', ');

  let replyText = `Dạ chào bạn! Để chuẩn bị bữa ăn thơm ngon, bạn có thể tham khảo ${dishNames || 'các món ăn thanh lành trong thư viện'}.\n\n`;
  if (fridge?.custom_ingredients?.length || fridge?.ingredient_names?.length) {
    const allIng = [...(fridge.ingredient_names || []), ...(fridge.custom_ingredients || [])];
    replyText += `Với các nguyên liệu bạn đang có (**${allIng.join(', ')}**), bạn có thể xào tỏi nhanh gọn hoặc nấu một bát canh thanh mát giàu dinh dưỡng!`;
  } else {
    replyText += `Bạn có thể bấm vào thẻ món ăn bên dưới để xem chi tiết từng bước nấu và bảng thành phần dinh dưỡng nhé!`;
  }

  return {
    type: 'recipe',
    content: replyText,
    dishes: sampleDishes,
  };
}
