import { useState, useEffect } from 'react';
import { subjectService } from '../../services/subjectService';
import { Plus, Edit2, Trash2, BookOpen, X } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLORS[0],
    difficulty: 'medium',
    priority: 5,
    examDate: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data } = await subjectService.getAll();
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectService.update(editingSubject._id, formData);
      } else {
        await subjectService.create(formData);
      }
      fetchSubjects();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will delete the subject.')) return;
    try {
      await subjectService.delete(id);
      fetchSubjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete subject');
    }
  };

  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        description: subject.description || '',
        color: subject.color,
        difficulty: subject.difficulty,
        priority: subject.priority,
        examDate: subject.examDate ? format(new Date(subject.examDate), 'yyyy-MM-dd') : '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        description: '',
        color: COLORS[0],
        difficulty: 'medium',
        priority: 5,
        examDate: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading subjects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600 mt-1">Manage your study subjects</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Subject
        </button>
      </div>

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject._id}
              className="card-hover border-l-4"
              style={{ borderColor: subject.color }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: subject.color + '20' }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      subject.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      subject.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {subject.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(subject)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(subject._id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {subject.description && (
                <p className="text-sm text-gray-600 mb-3">{subject.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Priority: {subject.priority}/10</span>
                {subject.examDate && (
                  <span className="text-gray-600">
                    Exam: {format(new Date(subject.examDate), 'MMM dd')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
          <p className="text-gray-600 mb-6">Create your first subject to get started</p>
          <button onClick={() => openModal()} className="btn-primary">
            Add Your First Subject
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingSubject ? 'Update' : 'Create'}
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