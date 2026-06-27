import express from 'express';
import {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  getSubjectStats,
  updateStudyHours
} from '../controllers/subjectController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Subject CRUD routes
router.route('/')
  .post(createSubject)      // Create new subject
  .get(getSubjects);        // Get all subjects

router.route('/:id')
  .get(getSubject)          // Get single subject
  .put(updateSubject)       // Update subject
  .delete(deleteSubject);   // Delete subject

// Additional subject routes
router.get('/:id/stats', getSubjectStats);           // Get subject statistics
router.put('/:id/study-hours', updateStudyHours);    // Update study hours

export default router;