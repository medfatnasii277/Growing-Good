import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminContentAPI, adminCategoryAPI, adminUserAPI } from '../../services/api';
import type { ContentItem, Category, User } from '../../types';
import { Users, BookOpen, FolderOpen, Settings, LogOut, Plus, Home, ArrowLeft, HelpCircle, Gamepad2 } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ content: 0, categories: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contentRes, categoryRes, userRes] = await Promise.all([
        adminContentAPI.list(),
        adminCategoryAPI.list(),
        adminUserAPI.list(),
      ]);
      setContent(contentRes.data);
      setCategories(categoryRes.data);
      setUsers(userRes.data);
      setStats({
        content: contentRes.data.length,
        categories: categoryRes.data.length,
        users: userRes.data.length,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-2xl flex items-center space-x-2 animate-fade-in">
          <div className="spinner"></div>
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md animate-fade-in">
          <div className="bg-white rounded-xl shadow-md p-6 mb-4 flex items-center space-x-4">
            <Settings className="w-8 h-8 text-red-500" />
            <span className="text-red-500 font-bold">Dashboard Error</span>
          </div>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadData}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Responsive Sidebar - Hidden on mobile, shown on larger screens */}
      <div className="hidden md:block md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:bg-gray-900 md:text-white md:p-4">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Growing Good
        </h1>
        <p className="text-sm text-gray-400 mb-6">Admin Panel</p>
        
        <nav className="space-y-2">
          <Link
            to="/admin"
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-800"
          >
            <Settings className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/admin/content"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800"
          >
            <BookOpen className="w-5 h-5" />
            Content
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
            <FolderOpen className="w-5 h-5" />
            Categories
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
            <Users className="w-5 h-5" />
            Users
          </Link>
          <div className="border-t border-gray-700 my-4"></div>
          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-green-400">
            <Home className="w-5 h-5" />
            Back to User View
          </Link>
        </nav>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 mt-auto absolute bottom-4 left-4 right-4">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Main Content - Pushes content when sidebar is visible */}
      <div className="md:ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-800 md:hidden">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          </div>
          <span className="text-gray-600">Welcome, {user?.username}!</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Content</p>
                <p className="text-3xl font-bold text-blue-600">{stats.content}</p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-200" />
            </div>
            <Link to="/admin/content" className="text-blue-500 hover:underline mt-4 block">
              Manage Content →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Categories</p>
                <p className="text-3xl font-bold text-green-600">{stats.categories}</p>
              </div>
              <FolderOpen className="w-12 h-12 text-green-200" />
            </div>
            <Link to="/admin/categories" className="text-green-500 hover:underline mt-4 block">
              Manage Categories →
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{stats.users}</p>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
            <Link to="/admin/users" className="text-purple-500 hover:underline mt-4 block">
              Manage Users →
            </Link>
          </div>
        </div>

        {/* Recent Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Recent Content</h3>
            <Link
              to="/admin/content/new"
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              Add Content
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {content.slice(0, 5).map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{item.title}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getIcon(item.content_type)}
                        <span className="capitalize">{item.content_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {categories.find(c => c.id === item.category_id)?.name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const getIcon = (type: string) => {
  switch (type) {
    case 'quiz': return <HelpCircle className="w-5 h-5 text-blue-500" />;
    case 'reading': return <BookOpen className="w-5 h-5 text-green-500" />;
    case 'click_game': return <Gamepad2 className="w-5 h-5 text-purple-500" />;
    default: return null;
  }
};

export default AdminDashboard;
