import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Target, Zap } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [focus, setFocus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [weeklyData, monthlyData, focusData] = await Promise.all([
        analyticsService.getWeekly(),
        analyticsService.getMonthly(),
        analyticsService.getFocus(),
      ]);
      setWeekly(weeklyData.data);
      setMonthly(monthlyData.data);
      setFocus(focusData.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your productivity and progress</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'weekly'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {view === 'weekly' && weekly && (
        <>
          {/* Weekly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Study Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {weekly.summary.totalStudyHours}h
                  </p>
                </div>
                <Clock className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {weekly.summary.totalSessions}
                  </p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {weekly.summary.tasksCompleted}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Daily</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {weekly.summary.avgDailyHours}h
                  </p>
                </div>
                <Zap className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Daily Study Time Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Study Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekly.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="studyTime" name="Study Time (min)" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Breakdown */}
          {weekly.subjectBreakdown && weekly.subjectBreakdown.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Study Time by Subject
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={weekly.subjectBreakdown}
                    dataKey="totalTime"
                    nameKey="subject"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {weekly.subjectBreakdown.map((entry, index) => (
                      <Cell key={entry.subject} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {view === 'monthly' && monthly && (
        <>
          {/* Monthly Trends */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly.weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="studyHours"
                  name="Study Hours"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="tasksCompleted"
                  name="Tasks Completed"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Performance */}
          {monthly.subjectPerformance && monthly.subjectPerformance.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Subject Performance
              </h2>
              <div className="space-y-4">
                {monthly.subjectPerformance.map((subject, index) => (
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
                        {subject.completed}/{subject.total} ({subject.completionRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${subject.completionRate}%`,
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Focus Insights */}
      {focus && focus.totalSessions > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Focus Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Focus Score */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Focus Score</p>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(focus.avgFocusScore / 10) * 201} 201`}
                      className="text-primary-600"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">
                      {focus.avgFocusScore}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Based on {focus.totalSessions} sessions
                  </p>
                </div>
              </div>
            </div>

            {/* Best Focus Time */}
            {focus.bestFocusTime && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Best Focus Time</p>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {focus.bestFocusTime.timeSlot}
                    </p>
                    <p className="text-sm text-gray-600">
                      Avg: {focus.bestFocusTime.avgFocusScore}/10
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Focus by Subject */}
          {focus.focusBySubject && focus.focusBySubject.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Focus by Subject</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {focus.focusBySubject.map((subject) => (
                  <div
                    key={subject.subject}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {subject.subject}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      {subject.avgFocusScore}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}