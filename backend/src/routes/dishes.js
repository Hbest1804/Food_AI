import express from 'express';
import {
  getDishes,
  getDishDetail
} from '../controllers/dishesController.js';
import { optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 4.3.1 Tìm kiếm & lọc món ăn
// GET /dishes hoặc /api/dishes
router.get('/', optionalAuthenticate, getDishes);

// Tiện ích GET /dishes/popular: chuyển tiếp tới sort=popular
router.get('/popular', optionalAuthenticate, (req, _res, next) => {
  req.query.sort = req.query.sort || 'popular';
  next();
}, getDishes);

// 4.3.2 Xem chi tiết món ăn & công thức
// GET /dishes/:idOrSlug hoặc /api/dishes/:idOrSlug
router.get('/:idOrSlug', optionalAuthenticate, getDishDetail);

export default router;
