// src/routes/chat.js
// Routes cho Chatbot AI (mục 4.4 và mục 5.2.1)

import { Router } from 'express';
import { sendGuestMessage, getGuestQuota } from '../controllers/guestChatController.js';

const router = Router();

// 4.4.1 Gửi câu hỏi (khách) - POST /chat/guest/messages
router.post('/guest/messages', sendGuestMessage);

// 5.2.1 Xem hạn mức lượt hỏi còn lại - GET /chat/guest/quota
router.get('/guest/quota', getGuestQuota);

export default router;
