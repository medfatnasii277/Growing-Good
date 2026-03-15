import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminUserAPI } from '../../services/api';
import type { User } from '../../types';
import { ArrowLeft, Users as UsersIcon } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminUserAPI.list();
      setUsers(response.data);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">Growing Good</h1>
        <p className="text-sm text-gray-400 mb-6">Admin Panel</p>
        <nav className="space-y-2">
          <Link to="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">Dashboard</Link>
          <Link to="/admin/content" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">Content</Link>
          <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">Categories</Link>
          <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">Users</Link>
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="text-gray-600"><ArrowLeft className="w-6 h-6" /></Link>
          <UsersIcon className="w-7 h-7 text-gray-500" />
          <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Username</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{user.id}</td>
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
