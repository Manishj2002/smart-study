import { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { Calendar, Sparkles, RefreshCw, Clock, CheckCircle, X } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

export default function Scheduler() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week'); // week or today
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeData, setCompleteData] = useState({
    actualDuration: 0,
    focusScore: 5,
    notes: '',
  });

  useEffect(() => {
    fetchSchedules();
  }, [view]);

  const fetchSchedules = async () => {
    try {
      const { data } = view === 'today' 
        ? await scheduleService.getToday()
        : await scheduleService.getWeek();
      setSchedules(data.schedules);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!window.confirm('This will regenerate your schedule for the next 7 days. Continue?')) return;
    
    setLoading(true);
    try {
      await scheduleService.generate({ days: 7, includeWeekends: true });
      await fetchSchedules();
      alert('Smart schedule generated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    setLoading(true);
    try {
      await scheduleService.reschedule();
      await fetchSchedules();
      alert('Missed sessions rescheduled!');
    } catch (error) {
      alert('Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  const openCompleteModal = (schedule) => {
    setSelectedSchedule(schedule);
    setCompleteData({
      actualDuration: schedule.duration,
      focusScore: 5,
      notes: '',
    });
    setShowCompleteModal(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await scheduleService.complete(selectedSchedule._id, completeData);
      await fetchSchedules();
      setShowCompleteModal(false);
      alert('Session completed!');
    } catch (error) {
      alert('Failed to complete session');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await scheduleService.delete(id);
      await fetchSchedules();
    } catch (error) {
      alert('Failed to delete session');
    }
  };

  // Group schedules by day
  const groupedSchedules = {};
  const weekStart = startOfWeek(new Date());
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const dateKey = format(day, 'yyyy-MM-dd');
    groupedSchedules[dateKey] = {
      date: day,
      schedules: schedules.filter(s => 
        format(new Date(s.startTime), 'yyyy-MM-dd') === dateKey
      ),
    };
  }

  if (loading) {
    return <div className="text-center py-8">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-gray-600 mt-1">View and manage your study schedule</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSchedule}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Schedule
          </button>
          <button
            onClick={handleReschedule}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Reschedule
          </button>
        </div>
      </div>

      {/* View Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('today')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'today'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'week'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          This Week
        </button>
      </div>

      {/* Schedule View */}
      {view === 'week' ? (
        <div className="space-y-6">
          {Object.values(groupedSchedules).map(({ date, schedules: daySchedules }) => (
            <div key={date} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {format(date, 'EEEE')}
                  </h3>
                  <p className="text-sm text-gray-600">{format(date, 'MMMM dd, yyyy')}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {daySchedules.length} session{daySchedules.length !== 1 ? 's' : ''}
                </span>
              </div>

              {daySchedules.length > 0 ? (
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-1 h-16 rounded-full"
                        style={{ backgroundColor: schedule.subject?.color || '#3B82F6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {schedule.isBreak ? 'Break' : schedule.task?.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(schedule.startTime), 'HH:mm')} - 
                              {format(new Date(schedule.endTime), 'HH:mm')}
                            </span>
                          </div>
                          <span>•</span>
                          <span>{schedule.duration} min</span>
                          {!schedule.isBreak && (
                            <>
                              <span>•</span>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {schedule.subject?.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {schedule.status === 'completed' ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm">Done</span>
                          </span>
                        ) : schedule.status === 'scheduled' && !schedule.isBreak ? (
                          <button
                            onClick={() => openCompleteModal(schedule)}
                            className="btn-primary text-sm py-1 px-3"
                          >
                            Complete
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(schedule._id)}
                          className="p-1 hover:bg-white rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No sessions scheduled</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
          </div>
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <div
                    className="w-2 h-20 rounded-full"
                    style={{ backgroundColor: schedule.subject?.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {schedule.isBreak ? 'Break Time' : schedule.task?.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(schedule.startTime), 'HH:mm')} - 
                          {format(new Date(schedule.endTime), 'HH:mm')}
                        </span>
                      </div>
                      <span>{schedule.duration} minutes</span>
                      {!schedule.isBreak && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {schedule.subject?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {schedule.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : !schedule.isBreak ? (
                      <button
                        onClick={() => openCompleteModal(schedule)}
                        className="btn-primary"
                      >
                        Complete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions today</h3>
              <p className="text-gray-600 mb-6">Generate a smart schedule to get started</p>
              <button onClick={handleGenerateSchedule} className="btn-primary">
                Generate Schedule
              </button>
            </div>
          )}
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Complete Session</h2>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={completeData.actualDuration}
                  onChange={(e) => setCompleteData({ ...completeData, actualDuration: parseInt(e.target.value) })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Focus Score (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={completeData.focusScore}
                  onChange={(e) => setCompleteData({ ...completeData, focusScore: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Low</span>
                  <span className="font-medium text-primary-600">{completeData.focusScore}</span>
                  <span>High</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={completeData.notes}
                  onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="How did it go?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}