import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, ProtectedRoute } from './routes';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Main Pages (we'll create these next)
import Dashboard from './pages/Dashboard/Dashboard';
import Subjects from './pages/Subjects/Subjects';
import Tasks from './pages/Tasks/Tasks';
import Scheduler from './pages/Scheduler/Scheduler';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';

// Layout
import Layout from './components/Layout/Layout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/scheduler" element={<Scheduler />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;