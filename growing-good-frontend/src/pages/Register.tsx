import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Sparkles, Sun, Cloud, Heart, Rocket } from 'lucide-react';
import { getErrorMessage } from '../utils/errors';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password);
      navigate('/');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center fun-bg relative overflow-hidden py-8 px-4">
      {/* Floating Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <Sun className="absolute top-8 left-8 w-14 h-14 text-yellow-400 animate-float opacity-60" />
        <Star className="absolute top-16 right-16 w-10 h-10 text-pink-400 animate-bounce-slow opacity-50" />
        <Star className="absolute bottom-24 left-20 w-6 h-6 text-yellow-300 animate-sparkle opacity-60" />
        <Cloud className="absolute top-1/3 right-8 w-14 h-14 text-blue-200 animate-float opacity-40" style={{ animationDelay: '1.5s' }} />
        <Heart className="absolute bottom-16 right-24 w-10 h-10 text-red-300 animate-bounce-slow opacity-50" style={{ animationDelay: '0.8s' }} />
        <Sparkles className="absolute top-1/4 left-16 w-8 h-8 text-purple-400 animate-sparkle opacity-50" />
        <Rocket className="absolute bottom-1/3 left-8 w-12 h-12 text-indigo-300 animate-float opacity-40" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Card */}
      <div className="fun-card p-8 w-full max-w-md animate-pop relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mb-4 shadow-lg animate-bounce-slow">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold rainbow-text mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Join Us!
          </h1>
          <p className="text-gray-500 text-lg">Create your adventure account! 🎉</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3 animate-wiggle">
            <span className="text-2xl">😅</span>
            <span className="font-semibold">Oops! {error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-600 text-sm font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">👤</span>
              Choose a Fun Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="fun-input w-full"
              placeholder="e.g., SuperStar2024"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">🔑</span>
              Create a Secret Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fun-input w-full"
              placeholder="Make it super secret!"
              required
            />
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50/70 px-4 py-3 text-sm text-purple-700">
            New accounts start as learner profiles. Admin access is managed separately for safety.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="fun-button btn-lavender w-full text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <span>{loading ? 'Creating Account...' : 'Create My Account'}</span>
              <Sparkles className="w-5 h-5" />
            </span>
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-purple-500 font-bold hover:text-purple-600 transition-colors inline-flex items-center gap-1"
            >
              Sign In
              <Star className="w-4 h-4" />
            </Link>
          </p>
        </div>

        {/* Fun Footer */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-100">
          <p className="text-center text-gray-400 text-sm">
            🎈 Join thousands of kids learning good manners! 🌈
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
