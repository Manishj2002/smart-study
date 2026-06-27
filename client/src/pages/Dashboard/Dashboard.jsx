import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { scheduleService } from '../../services/scheduleService';
import {
  TrendingUp,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await analyticsService.getDashboard();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      await scheduleService.generate({ days: 7, includeWeekends: true });
      fetchDashboard();
      alert('Smart schedule generated successfully!');
    } catch (error) {
      alert('Failed to generate schedule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Tasks',
      value: analytics?.overview?.totalTasks || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      label: 'Completed',
      value: analytics?.overview?.completedTasks || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Pending',
      value: analytics?.overview?.pendingTasks || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Overdue',
      value: analytics?.overview?.overdueTasks || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your study overview</p>
        </div>
        <button
          onClick={handleGenerateSchedule}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Sparkles className="w-5 h-5" />
          Generate Smart Schedule
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Productivity Score */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Productivity Score</h2>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(analytics?.overview?.productivityScore || 0) * 2.51} 251`}
                className="text-primary-600"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">
                {analytics?.overview?.productivityScore || 0}
              </span>
            </div>
          </div>
          <div>
            <p className="text-gray-600">
              You're doing great! Keep up the momentum.
            </p>
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">
                Completion Rate: {analytics?.overview?.completionRate || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          {analytics?.todaySchedule?.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics.todaySchedule.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: session.subject?.color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {session.task?.title || 'Break'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(session.startTime), 'HH:mm')} - 
                        {format(new Date(session.endTime), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  {session.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No sessions scheduled for today</p>
              <button
                onClick={handleGenerateSchedule}
                className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
              >
                Generate Schedule
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h2>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          {analytics?.upcomingDeadlines?.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics.upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/tasks')}
                >
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: task.subject?.color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {task.subject?.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {format(new Date(task.deadline), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${
                    task.daysUntilDeadline <= 2 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {task.daysUntilDeadline}d left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Progress */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subject Progress</h2>
        {analytics?.subjectProgress?.length > 0 ? (
          <div className="space-y-4">
            {analytics.subjectProgress.map((subject) => (
              <div key={subject.subject}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="font-medium text-gray-900">{subject.subject}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {subject.completed}/{subject.total} tasks ({subject.completionRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${subject.completionRate}%`,
                      backgroundColor: subject.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No subjects yet</p>
            <button
              onClick={() => navigate('/subjects')}
              className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
            >
              Create Your First Subject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}