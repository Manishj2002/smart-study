import express from 'express';
import {
  createSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  completeSchedule,
  getTodaySchedule,
  getWeekSchedule,
  getScheduleStats,
  generateSchedule,
  reschedule,
  balanceSchedule
} from '../controllers/scheduleController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Schedule statistics and special routes (before /:id)
router.get('/stats', getScheduleStats);
router.get('/today', getTodaySchedule);
router.get('/week', getWeekSchedule);

// Smart scheduling routes
router.post('/generate', generateSchedule);
router.post('/reschedule', reschedule);
router.post('/balance', balanceSchedule);

// Schedule CRUD routes
router.route('/')
  .post(createSchedule)
  .get(getSchedules);

router.route('/:id')
  .get(getSchedule)
  .put(updateSchedule)
  .delete(deleteSchedule);

// Complete schedule
router.put('/:id/complete', completeSchedule);

export default router;