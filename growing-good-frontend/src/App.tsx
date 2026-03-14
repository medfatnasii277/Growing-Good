import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ContentDetail from './pages/ContentDetail';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminContent from './pages/admin/AdminContent';
import AdminCategories from './pages/admin/AdminCategories';
import AdminUsers from './pages/admin/AdminUsers';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  // Redirect to appropriate dashboard based on role
  const getDashboardPath = () => isAdmin ? '/admin' : '/';
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <Register />} />
      
      {/* User Routes - redirect admin to admin dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          {isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />}
        </ProtectedRoute>
      } />
      <Route path="/content/:id" element={
        <ProtectedRoute>
          <ContentDetail />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/content" element={
        <ProtectedRoute requireAdmin>
          <AdminContent />
        </ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute requireAdmin>
          <AdminCategories />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <AdminUsers />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
