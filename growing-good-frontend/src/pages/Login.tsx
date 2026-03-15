import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Sparkles, Sun, Moon, Cloud, Heart } from 'lucide-react';
import { getErrorMessage } from '../utils/errors';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center fun-bg relative overflow-hidden py-8 px-4">
      {/* Floating Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <Sun className="absolute top-8 right-8 w-16 h-16 text-yellow-400 animate-float opacity-60" />
        <Star className="absolute top-20 left-12 w-8 h-8 text-yellow-300 animate-bounce-slow opacity-50" />
        <Star className="absolute bottom-32 right-20 w-6 h-6 text-pink-400 animate-sparkle opacity-60" />
        <Cloud className="absolute top-1/4 left-8 w-12 h-12 text-blue-200 animate-float opacity-40" style={{ animationDelay: '1s' }} />
        <Heart className="absolute bottom-20 left-16 w-8 h-8 text-red-300 animate-bounce-slow opacity-50" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute top-1/3 right-12 w-10 h-10 text-purple-400 animate-sparkle opacity-50" />
        <Moon className="absolute bottom-1/4 right-8 w-10 h-10 text-indigo-300 animate-float opacity-40" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Card */}
      <div className="fun-card p-8 w-full max-w-md animate-pop relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 mb-4 shadow-lg animate-bounce-slow">
            <Star className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-bold rainbow-text mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Growing Good
          </h1>
          <p className="text-gray-500 text-lg">Learn, Play & Grow! 🌱</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3 animate-wiggle">
            <span className="text-2xl">😅</span>
            <span className="font-semibold">Oops! {error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-600 text-sm font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">👤</span>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="fun-input w-full"
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">🔑</span>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fun-input w-full"
              placeholder="Enter your secret password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="fun-button btn-sunshine w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="spinner"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Let's Go!</span>
                <span className="text-xl">🚀</span>
              </span>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            New here?{' '}
            <Link 
              to="/register" 
              className="text-blue-500 font-bold hover:text-blue-600 transition-colors inline-flex items-center gap-1"
            >
              Join the Fun!
              <Sparkles className="w-4 h-4" />
            </Link>
          </p>
        </div>

        {/* Fun Footer */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-100">
          <p className="text-center text-gray-400 text-sm">
            🌟 Learn manners with fun games! 🎮
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
