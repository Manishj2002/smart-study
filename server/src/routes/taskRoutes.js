import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  getOverdueTasks,
  getUpcomingTasks,
  getTasksBySubject,
  getTaskStats
} from '../controllers/taskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Task statistics (must be before /:id routes)
router.get('/stats', getTaskStats);

// Overdue and upcoming tasks
router.get('/overdue', getOverdueTasks);
router.get('/upcoming', getUpcomingTasks);

// Tasks by subject
router.get('/subject/:subjectId', getTasksBySubject);

// Task CRUD routes
router.route('/')
  .post(createTask)      // Create new task
  .get(getTasks);        // Get all tasks (with filters)

router.route('/:id')
  .get(getTask)          // Get single task
  .put(updateTask)       // Update task
  .delete(deleteTask);   // Delete task

// Complete task
router.put('/:id/complete', completeTask);

export default router;