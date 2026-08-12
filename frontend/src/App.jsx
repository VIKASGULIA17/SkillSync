import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/HomePage.jsx';
import AnalyzePage from './pages/AnalyzePage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TrackerPage from './pages/TrackerPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/analyze" 
            element={
              <ProtectedRoute>
                <AnalyzePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
