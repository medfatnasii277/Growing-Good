import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminContentAPI, adminCategoryAPI } from '../../services/api';
import type {
  Category,
  ClickGameData,
  ContentData,
  ContentItem,
  ContentType,
  CreateContentRequest,
  QuizData,
  QuizQuestion,
  ReadingData,
} from '../../types';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, HelpCircle, Gamepad2 } from 'lucide-react';
import { getErrorMessage } from '../../utils/errors';

const AdminContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contentRes, categoryRes] = await Promise.all([
        adminContentAPI.list(),
        adminCategoryAPI.list(),
      ]);
      setContent(contentRes.data);
      setCategories(categoryRes.data);
      setError('');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await adminContentAPI.delete(id);
      await loadData();
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete content'));
    }
  };

  const getIcon = (type: ContentType) => {
    switch (type) {
      case 'quiz':
        return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'reading':
        return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'click_game':
        return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 p-4 text-white">
        <h1 className="mb-8 flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-6 w-6" />
          Growing Good
        </h1>
        <p className="mb-6 text-sm text-gray-400">Admin Panel</p>
        <nav className="space-y-2">
          <Link to="/admin" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-800">
            Dashboard
          </Link>
          <Link to="/admin/content" className="flex items-center gap-3 rounded-lg bg-gray-800 p-3">
            Content
          </Link>
          <Link to="/admin/categories" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-800">
            Categories
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-800">
            Users
          </Link>
        </nav>
      </div>

      <div className="ml-64 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h2 className="text-3xl font-bold text-gray-800">Content Management</h2>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {showForm ? (
          <ContentForm
            categories={categories}
            editingItem={editingItem}
            onSave={() => {
              setShowForm(false);
              void loadData();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-md">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {content.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getIcon(item.content_type)}
                        <span className="capitalize">{item.content_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {categories.find((category) => category.id === item.category_id)?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                          className="rounded p-2 text-blue-500 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="rounded p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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

const ContentForm = ({
  categories,
  editingItem,
  onSave,
  onCancel,
}: {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await adminContentAPI.update(editingItem.id, formData);
      } else {
        await adminContentAPI.create(formData);
      }
      onSave();
    } catch (error: unknown) {
      console.error(getErrorMessage(error, 'Failed to save content'));
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h3 className="mb-6 text-xl font-bold">{editingItem ? 'Edit Content' : 'Create New Content'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Content Type</label>
            <select
              value={formData.content_type}
              onChange={(e) => {
                const nextType = e.target.value as ContentType;
                setFormData({
                  ...formData,
                  content_type: nextType,
                  data: getDefaultData(nextType),
                });
              }}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="quiz">Quiz</option>
              <option value="reading">Reading</option>
              <option value="click_game">Click Game</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Content Data</label>
          {formData.content_type === 'quiz' && (
            <QuizForm data={formData.data as QuizData} onChange={(data) => setFormData({ ...formData, data })} />
          )}
          {formData.content_type === 'reading' && (
            <ReadingForm
              data={formData.data as ReadingData}
              onChange={(data) => setFormData({ ...formData, data })}
            />
          )}
          {formData.content_type === 'click_game' && (
            <ClickGameForm
              data={formData.data as ClickGameData}
              onChange={(data) => setFormData({ ...formData, data })}
            />
          )}
        </div>

        <div className="flex gap-4">
          <button type="submit" className="rounded-lg bg-green-500 px-6 py-2 text-white hover:bg-green-600">
            {editingItem ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const QuizForm = ({ data, onChange }: { data: QuizData; onChange: (data: QuizData) => void }) => {
  const addQuestion = () => {
    onChange({
      ...data,
      questions: [...data.questions, { question: '', options: ['', '', '', ''], correct_index: 0 }],
    });
  };

  const updateQuestion = (
    index: number,
    field: keyof QuizQuestion,
    value: QuizQuestion[keyof QuizQuestion]
  ) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange({ ...data, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...data,
      questions: data.questions.filter((_, questionIndex) => questionIndex !== index),
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...data.questions];
    newQuestions[questionIndex].options = [...newQuestions[questionIndex].options];
    newQuestions[questionIndex].options[optionIndex] = value;
    onChange({ ...data, questions: newQuestions });
  };

  return (
    <div className="space-y-6 rounded-lg bg-gray-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Passing Score (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={data.passing_score || 70}
          onChange={(e) => onChange({ ...data, passing_score: Number(e.target.value) })}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Questions</h4>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
          >
            <Plus className="h-4 w-4" /> Add Question
          </button>
        </div>

        {data.questions.map((question, questionIndex) => (
          <div key={questionIndex} className="space-y-3 rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-gray-500">Question {questionIndex + 1}</span>
              <button
                type="button"
                onClick={() => removeQuestion(questionIndex)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter your question"
              value={question.question}
              onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
            />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Options (select the correct answer):</p>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    checked={question.correct_index === optionIndex}
                    onChange={() => updateQuestion(questionIndex, 'correct_index', optionIndex)}
                    className="h-4 w-4 text-green-600"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                    className="flex-1 rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReadingForm = ({ data, onChange }: { data: ReadingData; onChange: (data: ReadingData) => void }) => {
  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Story Title</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
          placeholder="Enter story title"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
        <textarea
          value={data.content || ''}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
          rows={8}
          placeholder="Write your story content here..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Reading Time (minutes)</label>
          <input
            type="number"
            min="1"
            value={data.reading_time_minutes || 5}
            onChange={(e) => onChange({ ...data, reading_time_minutes: Number(e.target.value) })}
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Moral/Lesson</label>
          <input
            type="text"
            value={data.moral || ''}
            onChange={(e) => onChange({ ...data, moral: e.target.value })}
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
            placeholder="What is the moral of the story?"
          />
        </div>
      </div>
    </div>
  );
};

const ClickGameForm = ({ data, onChange }: { data: ClickGameData; onChange: (data: ClickGameData) => void }) => {
  const addItem = (type: 'correct_items' | 'wrong_items') => {
    onChange({ ...data, [type]: [...data[type], ''] });
  };

  const updateItem = (type: 'correct_items' | 'wrong_items', index: number, value: string) => {
    const newItems = [...data[type]];
    newItems[index] = value;
    onChange({ ...data, [type]: newItems });
  };

  const removeItem = (type: 'correct_items' | 'wrong_items', index: number) => {
    onChange({ ...data, [type]: data[type].filter((_, itemIndex) => itemIndex !== index) });
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Scenario</label>
        <input
          type="text"
          value={data.scenario || ''}
          onChange={(e) => onChange({ ...data, scenario: e.target.value })}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
          placeholder="What should the player do?"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Time Limit (seconds)</label>
        <input
          type="number"
          min="5"
          value={data.time_limit_seconds || 30}
          onChange={(e) => onChange({ ...data, time_limit_seconds: Number(e.target.value) })}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-green-700">Correct Items</label>
            <button
              type="button"
              onClick={() => addItem('correct_items')}
              className="text-sm text-green-600 hover:text-green-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {data.correct_items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem('correct_items', index, e.target.value)}
                  className="flex-1 rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="Safe choice"
                />
                <button type="button" onClick={() => removeItem('correct_items', index)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-red-700">Wrong Items</label>
            <button
              type="button"
              onClick={() => addItem('wrong_items')}
              className="text-sm text-red-600 hover:text-red-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {data.wrong_items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem('wrong_items', index, e.target.value)}
                  className="flex-1 rounded-lg border px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="Dangerous choice"
                />
                <button type="button" onClick={() => removeItem('wrong_items', index)} className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function getDefaultData(type: ContentType): ContentData {
  switch (type) {
    case 'quiz':
      return {
        questions: [{ question: 'Sample question?', options: ['A', 'B', 'C', 'D'], correct_index: 0 }],
        passing_score: 70,
      };
    case 'reading':
      return {
        title: 'Story Title',
        content: 'Once upon a time...',
        reading_time_minutes: 5,
        moral: 'Always be kind',
      };
    case 'click_game':
      return {
        scenario: 'What should you do?',
        correct_items: ['safe_choice'],
        wrong_items: ['danger_choice'],
        time_limit_seconds: 30,
      };
  }
}

export default AdminContent;
