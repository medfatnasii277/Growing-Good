import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminContentAPI, adminCategoryAPI } from '../../services/api';
import type { ContentItem, Category, CreateContentRequest } from '../../types';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, HelpCircle, Gamepad2 } from 'lucide-react';

const AdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contentRes, categoryRes] = await Promise.all([
        adminContentAPI.list(),
        adminCategoryAPI.list(),
      ]);
      setContent(contentRes.data);
      setCategories(categoryRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await adminContentAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'reading': return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'click_game': return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Growing Good
        </h1>
        <p className="text-sm text-gray-400 mb-6">Admin Panel</p>
        <nav className="space-y-2">
          <Link to="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
            Dashboard
          </Link>
          <Link to="/admin/content" className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
            Content
          </Link>
          <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
            Categories
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
            Users
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-3xl font-bold text-gray-800">Content Management</h2>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>

        {showForm ? (
          <ContentForm
            categories={categories}
            editingItem={editingItem}
            onSave={() => {
              setShowForm(false);
              loadData();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.map((item) => (
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
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const ContentForm = ({ categories, editingItem, onSave, onCancel }: {
  categories: Category[];
  editingItem: ContentItem | null;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<CreateContentRequest>({
    title: editingItem?.title || '',
    description: editingItem?.description || '',
    content_type: editingItem?.content_type || 'quiz',
    category_id: editingItem?.category_id,
    data: editingItem?.data || getDefaultData('quiz'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await adminContentAPI.update(editingItem.id, formData);
      } else {
        await adminContentAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold mb-6">
        {editingItem ? 'Edit Content' : 'Create New Content'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={formData.content_type}
              onChange={(e) => setFormData({ 
                ...formData, 
                content_type: e.target.value as any,
                data: getDefaultData(e.target.value)
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="quiz">Quiz</option>
              <option value="reading">Reading</option>
              <option value="click_game">Click Game</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content Data (JSON)</label>
          <textarea
            value={JSON.stringify(formData.data, null, 2)}
            onChange={(e) => {
              try {
                setFormData({ ...formData, data: JSON.parse(e.target.value) });
              } catch {}
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
            rows={10}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
          >
            {editingItem ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

function getDefaultData(type: string): any {
  switch (type) {
    case 'quiz':
      return {
        questions: [
          { question: "Sample question?", options: ["A", "B", "C", "D"], correct_index: 0 }
        ],
        passing_score: 70
      };
    case 'reading':
      return {
        title: "Story Title",
        content: "Once upon a time...",
        reading_time_minutes: 5,
        moral: "Always be kind"
      };
    case 'click_game':
      return {
        scenario: "What should you do?",
        correct_items: ["safe_choice"],
        wrong_items: ["danger_choice"],
        time_limit_seconds: 30
      };
    default:
      return {};
  }
}

export default AdminContent;
