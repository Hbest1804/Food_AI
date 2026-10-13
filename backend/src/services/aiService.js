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

export { AIServiceError };

/**
 * Phân tích và sinh câu trả lời cá nhân hóa đầy đủ cho người dùng đăng nhập (UC07 / Mục 4.6).
 * @param {Object} params
 * @param {string} params.content Nội dung câu hỏi
 * @param {Object} [params.userProfile] Hồ sơ khẩu vị đầy đủ (diets, allergens, dislikes, taste_prefs, calorie_goal)
 * @param {Array} [params.favoriteDishes] Món ăn yêu thích của người dùng
 * @param {Array} [params.chatHistory] Lịch sử các tin nhắn gần đây trong hội thoại
 * @param {Object} [params.fridge] Nguyên liệu trong tủ lạnh thông minh
 * @param {Array} [params.dishesContext] Danh sách món an toàn trong CSDL đã lọc bỏ dị ứng/kiêng
 * @returns {Promise<{ outcome: 'answered'|'no_match'|'out_of_scope'|'fallback', content: string, dishes: Array, tokens: number }>}
 */
export async function generatePersonalizedReply({
  content,
  userProfile = {},
  favoriteDishes = [],
  chatHistory = [],
  fridge = {},
  dishesContext = [],
}) {
  if (!env.gemini.apiKey) {
    return fallbackPersonalizedResponse({
      content,
      userProfile,
      favoriteDishes,
      fridge,
      dishesContext,
    });
  }

  const prompt = buildPersonalizedPrompt({
    content,
    userProfile,
    favoriteDishes,
    chatHistory,
    fridge,
    dishesContext,
  });

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
            maxOutputTokens: 1500,
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
    console.error('Gemini Personalized API Error:', response.status, errText);
    throw new AIServiceError('AI_SERVICE_ERROR', 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại.', 502);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokenCount = data.usageMetadata?.totalTokenCount || Math.ceil((content.length + (rawText?.length || 0)) / 4);

  if (!rawText) {
    throw new AIServiceError('AI_SERVICE_ERROR', 'Mô hình AI không trả về nội dung.', 502);
  }

  return parsePersonalizedResponse(rawText, dishesContext, tokenCount);
}

/**
 * Xây dựng prompt cá nhân hóa cho Gemini tích hợp ngữ cảnh khẩu vị, kiêng kỵ và lịch sử hội thoại
 */
function buildPersonalizedPrompt({
  content,
  userProfile,
  favoriteDishes,
  chatHistory,
  fridge,
  dishesContext,
}) {
  const dishesSummary = dishesContext.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    cook_time_minutes: d.cook_time_minutes,
    difficulty: d.difficulty,
  }));

  // Hồ sơ khẩu vị
  const profileParts = [];
  if (userProfile.diet_types?.length) {
    profileParts.push(`- Chế độ ăn uống: ${userProfile.diet_types.map((d) => d.name).join(', ')}`);
  }
  if (userProfile.allergen_groups?.length) {
    profileParts.push(`- ⚠️ NHÓM DỊ ỨNG (TUYỆT ĐỐI TRÁNH): ${userProfile.allergen_groups.map((a) => a.name).join(', ')}`);
  }
  if (userProfile.disliked_ingredients?.length) {
    profileParts.push(`- Nguyên liệu không thích: ${userProfile.disliked_ingredients.map((i) => i.name).join(', ')}`);
  }
  if (userProfile.taste_prefs) {
    const { spicy_level, salty_level, sweet_level, sour_level } = userProfile.taste_prefs;
    profileParts.push(`- Khẩu vị (thang 0-5): Cay: ${spicy_level ?? 0}/5, Mặn: ${salty_level ?? 0}/5, Ngọt: ${sweet_level ?? 0}/5, Chua: ${sour_level ?? 0}/5`);
  }
  if (userProfile.calorie_goal) {
    profileParts.push(`- Mục tiêu calo: ~${userProfile.calorie_goal} kcal/ngày`);
  }
  if (userProfile.household_size) {
    profileParts.push(`- Quy mô gia đình/khẩu phần: ${userProfile.household_size} người`);
  }

  // Món yêu thích
  const favList = favoriteDishes.map((f) => f.name).join(', ');

  // Tủ lạnh
  const fridgeParts = [];
  if (fridge?.ingredient_names?.length) {
    fridgeParts.push(`Nguyên liệu trong danh mục: ${fridge.ingredient_names.join(', ')}`);
  }
  if (fridge?.custom_ingredients?.length) {
    fridgeParts.push(`Nguyên liệu nhập tay: ${fridge.custom_ingredients.join(', ')}`);
  }

  // Lịch sử hội thoại gần đây (tối đa 6 tin nhắn gần nhất)
  const historyText = chatHistory.slice(-6).map((m) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.content}`).join('\n');

  return `Bạn là "CulinaAI" - Trợ lý ẩm thực cá nhân hóa thông minh của Việt Nam (Use case UC07).
Nhiệm vụ của bạn là tư vấn ẩm thực, thực đơn, công thức nấu nướng được CÁ NHÂN HÓA TUYỆT ĐỐI cho người dùng.

HỒ SƠ NGƯỜI DÙNG HIỆN TẠI:
${profileParts.length ? profileParts.join('\n') : '(Chưa thiết lập hồ sơ chi tiết)'}
${favList ? `- Món yêu thích đã lưu: ${favList}` : ''}

NGUYÊN LIỆU TRONG TỦ LẠNH THÔNG MINH (NẾU CÓ):
${fridgeParts.length ? fridgeParts.join('\n') : '(Không có gửi kèm)'}

DANH SÁCH MÓN ĂN PHÙ HỢP CÓ TRONG HỆ THỐNG (ĐÃ SƠ TUYỂN AN TOÀN, KHÔNG CHỨA DỊ ỨNG):
${JSON.stringify(dishesSummary, null, 2)}

${historyText ? `LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n${historyText}\n` : ''}
CÂU HỎI MỚI CỦA NGƯỜI DÙNG:
"${content}"

QUY TẮC NGHIỆP VỤ BẮT BUỘC:
1. NỘI DUNG NGOÀI PHẠM VI (out_of_scope):
   - Nếu câu hỏi HOÀN TOÀN KHÔNG liên quan đến ẩm thực, nấu nướng, món ăn, chế độ dinh dưỡng (ví dụ: công nghệ, toán học, thời sự, giải trí...):
   - Từ chối lịch sự, giải thích rằng CulinaAI chỉ hỗ trợ ẩm thực và dinh dưỡng.
   - Đặt "outcome": "out_of_scope".

2. KHÔNG TÌM ĐƯỢC MÓN THỎA RÀNG BUỘC (no_match):
   - Nếu người dùng đặt ra các điều kiện quá khắt khe hoặc nguyên liệu tủ lạnh không thể nấu được món nào phù hợp với chế độ ăn/dị ứng:
   - Hãy giải thích lịch sự và chủ động đề xuất nới lỏng một vài điều kiện để có nhiều lựa chọn hơn.
   - Đặt "outcome": "no_match".

3. CÂU HỎI ẨM THỰC HỢP LỆ (answered):
   - Trả lời nhiệt tình, chuyên nghiệp, sử dụng Markdown sinh động.
   - Luôn tôn trọng TUYỆT ĐỐI nhóm dị ứng và nguyên liệu kiêng kỵ của người dùng.
   - Nếu gợi ý món từ danh sách hệ thống, hãy điền id của món đó vào "matched_dish_ids".
   - Nếu sáng tạo món mới từ tủ lạnh, hãy hướng dẫn cách làm chi tiết từng bước.
   - Đặt "outcome": "answered".

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (DUY NHẤT 1 CHUỖI JSON HỢP LỆ):
{
  "outcome": "answered" | "no_match" | "out_of_scope",
  "content": "Nội dung phản hồi Markdown chi tiết bằng tiếng Việt",
  "matched_dish_ids": ["uuid-mon-1", "uuid-mon-2"]
}`;
}

/**
 * Xử lý kết quả trả về từ Gemini cho phản hồi cá nhân hóa
 */
function parsePersonalizedResponse(rawText, dishesContext, tokenCount = 150) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const isOut = /(không|chưa) liên quan.*ẩm thực|chỉ hỗ trợ.*nấu ăn/i.test(cleaned);
    const isNoMatch = /(không tìm thấy|không có món nào phù hợp|nới lỏng điều kiện)/i.test(cleaned);
    const outcome = isOut ? 'out_of_scope' : isNoMatch ? 'no_match' : 'answered';
    return {
      outcome,
      content: cleaned,
      dishes: [],
      tokens: tokenCount,
    };
  }

  const outcome = ['answered', 'no_match', 'out_of_scope', 'fallback'].includes(parsed.outcome)
    ? parsed.outcome
    : (parsed.type === 'out_of_scope' ? 'out_of_scope' : 'answered');

  const matchedIds = Array.isArray(parsed.matched_dish_ids) ? parsed.matched_dish_ids : [];
  const dishes = dishesContext.filter((d) => matchedIds.includes(d.id));

  return {
    outcome,
    content: parsed.content || 'Dạ, CulinaAI rất hân hạnh đồng hành cùng bữa ăn của bạn!',
    dishes,
    tokens: tokenCount,
  };
}

/**
 * Fallback khi chưa có API key trong chế độ cá nhân hóa
 */
function fallbackPersonalizedResponse({
  content,
  userProfile,
  favoriteDishes,
  fridge,
  dishesContext,
}) {
  const c = content.toLowerCase();
  const isCooking = /(nấu|món|canh|kho|xào|nướng|thịt|cá|rau|trứng|ăn gì|bữa|calo|công thức|tủ lạnh|thực đơn|chay|diet|dinh dưỡng)/i.test(c);

  if (!isCooking) {
    return {
      outcome: 'out_of_scope',
      content: 'Dạ em là trợ lý ẩm thực CulinaAI, em chỉ có thể hỗ trợ các câu hỏi liên quan đến ẩm thực, món ăn, dinh dưỡng và gợi ý thực đơn cá nhân hóa thôi ạ. Bạn có muốn tìm gợi ý món ngon cho hôm nay không?',
      dishes: [],
      tokens: 65,
    };
  }

  // Kiểm tra trường hợp không có món nào phù hợp
  if (dishesContext.length === 0 && fridge?.ingredient_names?.length) {
    return {
      outcome: 'no_match',
      content: 'Hiện tại hệ thống không tìm thấy món ăn nào vừa khớp hoàn toàn với nguyên liệu trong tủ lạnh mà lại đáp ứng các tiêu chí kiêng kỵ trong hồ sơ của bạn. Bạn có muốn nới lỏng bớt điều kiện hoặc tham khảo thêm các nguyên liệu phổ biến khác không?',
      dishes: [],
      tokens: 85,
    };
  }

  const sampleDishes = dishesContext.slice(0, 2);
  const dishNames = sampleDishes.map((d) => `**${d.name}**`).join(', ');

  const dietNote = userProfile.diet_types?.length
    ? `theo chế độ **${userProfile.diet_types.map((d) => d.name).join(', ')}** `
    : '';

  const caloNote = userProfile.calorie_goal
    ? ` (phù hợp mục tiêu ~${userProfile.calorie_goal} kcal)`
    : '';

  let replyText = `Dạ chào bạn! Để chuẩn bị bữa ăn ${dietNote}thanh lành và thơm ngon${caloNote}, CulinaAI xin gợi ý bạn có thể thưởng thức ${dishNames || 'các món ăn giàu dinh dưỡng trong thư viện'}.\n\n`;

  if (userProfile.allergen_groups?.length) {
    replyText += `🛡️ *Tất cả gợi ý trên đã được lọc bỏ hoàn toàn các thành phần liên quan đến: ${userProfile.allergen_groups.map((a) => a.name).join(', ')}.*\n\n`;
  }

  if (fridge?.custom_ingredients?.length || fridge?.ingredient_names?.length) {
    const allIng = [...(fridge.ingredient_names || []), ...(fridge.custom_ingredients || [])];
    replyText += `Với các nguyên liệu bạn đang có trong tủ lạnh (**${allIng.join(', ')}**), bạn có thể kết hợp chế biến nhanh gọn, vừa tiết kiệm vừa ngon miệng!`;
  } else {
    replyText += `Bạn có thể bấm vào thẻ món ăn bên dưới để xem hướng dẫn từng bước nấu chuẩn vị nhé!`;
  }

  return {
    outcome: 'answered',
    content: replyText,
    dishes: sampleDishes,
    tokens: 120,
  };
}

