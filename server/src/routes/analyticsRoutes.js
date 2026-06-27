import express from 'express';
import {
  getDashboard,
  getWeekly,
  getMonthly,
  getFocus
} from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Analytics routes
router.get('/dashboard', getDashboard);
router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/focus', getFocus);

export default router;