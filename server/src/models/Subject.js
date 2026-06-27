import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a subject name'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  priority: {
    type: Number,
    default: 5,
    min: [1, 'Priority must be between 1-10'],
    max: [10, 'Priority must be between 1-10']
  },
  examDate: {
    type: Date,
    default: null
  },
  totalStudyHours: {
    type: Number,
    default: 0 // Track total hours studied
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
subjectSchema.index({ user: 1, isActive: 1 });

// Virtual for calculating urgency (days until exam)
subjectSchema.virtual('daysUntilExam').get(function() {
  if (!this.examDate) return null;
  const today = new Date();
  const diffTime = this.examDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Ensure virtuals are included when converting to JSON
subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;