import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { User, Clock, Bell, Lock, Save } from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    studyGoals: user?.studyGoals || '',
    dailyAvailableHours: user?.dailyAvailableHours || 4,
    preferredBreakDuration: user?.preferredBreakDuration || 15,
    notificationsEnabled: user?.notificationsEnabled ?? true,
    theme: user?.theme || 'light',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await authService.updateProfile(profileData);
      updateUser(data.data.user);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Profile Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email}
              className="input-field bg-gray-100"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Study Goals
            </label>
            <textarea
              value={profileData.studyGoals}
              onChange={(e) => setProfileData({ ...profileData, studyGoals: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="What are your study goals?"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Study Preferences */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Study Preferences</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Available Study Hours
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={profileData.dailyAvailableHours}
              onChange={(e) => setProfileData({ ...profileData, dailyAvailableHours: parseInt(e.target.value) })}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              How many hours can you study per day?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Break Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={profileData.preferredBreakDuration}
              onChange={(e) => setProfileData({ ...profileData, preferredBreakDuration: parseInt(e.target.value) })}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Break time between study sessions
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Enable Notifications</p>
            <p className="text-sm text-gray-600">Receive reminders for study sessions</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.notificationsEnabled}
              onChange={(e) => setProfileData({ ...profileData, notificationsEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}