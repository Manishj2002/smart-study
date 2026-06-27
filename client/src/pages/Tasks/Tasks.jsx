import { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { subjectService } from '../../services/subjectService';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, X, Filter } from 'lucide-react';
import { format } from 'date-fns';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const STATUSES = ['pending', 'in-progress', 'completed', 'skipped'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    difficulty: '',
    subject: '',
    sortBy: 'priority',
  });
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    difficulty: 'medium',
    estimatedTime: 60,
    deadline: '',
    priority: 5,
    notes: '',
  });

  useEffect(() => {
    fetchSubjects();
    fetchTasks();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      const { data } = await subjectService.getAll();
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.subject) params.subject = filters.subject;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const { data } = await taskService.getAll(params);
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await taskService.update(editingTask._id, formData);
      } else {
        await taskService.create(formData);
      }
      fetchTasks();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.delete(id);
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleComplete = async (id) => {
    try {
      await taskService.complete(id, 0);
      fetchTasks();
    } catch (error) {
      alert('Failed to complete task');
    }
  };

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        subject: task.subject._id,
        title: task.title,
        description: task.description || '',
        difficulty: task.difficulty,
        estimatedTime: task.estimatedTime,
        deadline: format(new Date(task.deadline), 'yyyy-MM-dd'),
        priority: task.priority,
        notes: task.notes || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        subject: subjects[0]?._id || '',
        title: '',
        description: '',
        difficulty: 'medium',
        estimatedTime: 60,
        deadline: '',
        priority: 5,
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your study tasks</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="input-field"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="input-field"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="input-field"
          >
            <option value="priority">Sort by Priority</option>
            <option value="deadline">Sort by Deadline</option>
            <option value="difficulty">Sort by Difficulty</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="card hover:shadow-lg transition-shadow border-l-4"
              style={{ borderColor: task.subject?.color || '#3B82F6' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                    {task.isOverdue && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  {task.description && (
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {task.subject?.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Deadline:</span>
                      <span className={task.isOverdue ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(task.deadline), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Priority Score:</span>
                      <span className="font-medium">{task.priorityScore}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleComplete(task._id)}
                      className="p-2 hover:bg-green-50 rounded text-green-600"
                      title="Mark Complete"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => openModal(task)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="p-2 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-6">Create your first task to get started</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Your First Task
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input-field"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time (min)
                  </label>
                  <input
                    type="number"
                    min="15"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingTask ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
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