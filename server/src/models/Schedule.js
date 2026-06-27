import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  startTime: {
    type: Date,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please provide end time']
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'skipped', 'rescheduled'],
    default: 'scheduled'
  },
  completedAt: {
    type: Date,
    default: null
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  focusScore: {
    type: Number, // 1-10 rating (optional user feedback)
    min: [1, 'Focus score must be between 1-10'],
    max: [10, 'Focus score must be between 1-10'],
    default: null
  },
  notes: {
    type: String,
    default: '',
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isBreak: {
    type: Boolean,
    default: false // To mark break sessions
  },
  reminderSent: {
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
scheduleSchema.index({ user: 1, startTime: 1 });
scheduleSchema.index({ task: 1, status: 1 });
scheduleSchema.index({ startTime: 1, endTime: 1 });

// Virtual to check if session is today
scheduleSchema.virtual('isToday').get(function() {
  const today = new Date();
  const sessionDate = new Date(this.startTime);
  return today.toDateString() === sessionDate.toDateString();
});

// Virtual to check if session is upcoming
scheduleSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.startTime;
});

// Virtual to check if session is in progress
scheduleSchema.virtual('isActive').get(function() {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime && this.status === 'in-progress';
});

// Ensure virtuals are included
scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

// Populate task and subject details
scheduleSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'task',
    select: 'title difficulty estimatedTime status'
  }).populate({
    path: 'subject',
    select: 'name color'
  });
  next();
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;