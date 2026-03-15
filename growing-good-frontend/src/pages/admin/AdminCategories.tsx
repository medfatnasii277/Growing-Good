import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminCategoryAPI } from '../../services/api';
import type { Category, CreateCategoryRequest } from '../../types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryRequest>({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await adminCategoryAPI.list();
      setCategories(response.data);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCategoryAPI.create(formData);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      await loadCategories();
      setError('');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create category'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try {
      await adminCategoryAPI.delete(id);
      await loadCategories();
      setError('');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete category'));
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
          <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">Categories</Link>
          <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">Users</Link>
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="text-gray-600"><ArrowLeft className="w-6 h-6" /></Link>
          <h2 className="text-3xl font-bold text-gray-800">Categories</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {showForm ? (
          <div className="bg-white rounded-xl shadow-md p-6 max-w-lg">
            <h3 className="text-xl font-bold mb-4">New Category</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-6 hover:bg-green-600"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg">{cat.name}</h3>
                    <button
                      type="button"
                      onClick={() => void handleDelete(cat.id)}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 mt-2">{cat.description || 'No description'}</p>
                  <p className="text-gray-400 text-sm mt-4">Created: {new Date(cat.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
