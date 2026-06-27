import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Task must belong to a subject']
  },
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Please specify task difficulty'],
    default: 'medium'
  },
  estimatedTime: {
    type: Number, // in minutes
    required: [true, 'Please provide estimated time'],
    min: [15, 'Estimated time must be at least 15 minutes'],
    max: [480, 'Estimated time cannot exceed 8 hours']
  },
  actualTime: {
    type: Number, // in minutes (tracked when completed)
    default: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Please provide a deadline']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'skipped'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 5,
    min: [1, 'Priority must be between 1-10'],
    max: [10, 'Priority must be between 1-10']
  },
  priorityScore: {
    type: Number,
    default: 0 // Calculated by the scheduling algorithm
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: '',
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ subject: 1, status: 1 });
taskSchema.index({ deadline: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return new Date() > this.deadline;
});

// Virtual for days until deadline
taskSchema.virtual('daysUntilDeadline').get(function() {
  const today = new Date();
  const diffTime = this.deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Calculate priority score before saving
taskSchema.pre('save', function(next) {
  // Priority Score = (Urgency × 2) + Difficulty Weight + User Priority
  const daysUntil = this.daysUntilDeadline;
  let urgencyScore = 0;
  
  if (daysUntil <= 1) urgencyScore = 10;
  else if (daysUntil <= 3) urgencyScore = 8;
  else if (daysUntil <= 7) urgencyScore = 6;
  else if (daysUntil <= 14) urgencyScore = 4;
  else urgencyScore = 2;
  
  const difficultyWeight = {
    'easy': 1,
    'medium': 2,
    'hard': 3
  };
  
  this.priorityScore = (urgencyScore * 2) + difficultyWeight[this.difficulty] + this.priority;
  next();
});

// Ensure virtuals are included
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;