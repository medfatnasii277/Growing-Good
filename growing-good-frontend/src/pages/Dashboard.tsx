import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import type {
  ContentItem,
  ContentType,
  LearningJourneyResponse,
  User as AppUser,
} from '../types';
import { 
  BookOpen, HelpCircle, Gamepad2, Star, CheckCircle, Shield, 
  Sparkles, Sun, Cloud, Heart, Trophy, LogOut, User as UserIcon, Rocket, Brain, Timer, Target
} from 'lucide-react';
import ProfileEditModal from '../components/ProfileEditModal';
import { getErrorMessage } from '../utils/errors';

const Dashboard = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [journey, setJourney] = useState<LearningJourneyResponse | null>(null);
  const { user, logout, isAdmin, setUser } = useAuth();

  const loadContent = useCallback(async () => {
    try {
      const [contentResponse, recommendationsResponse] = await Promise.all([
        contentAPI.list(),
        contentAPI.getRecommendations(),
      ]);
      setContent(contentResponse.data);
      setJourney(recommendationsResponse.data);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load content'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  const handleUpdateUser = (updatedUser: Pick<AppUser, 'id' | 'username' | 'avatar'>) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, ...updatedUser } : currentUser));
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'quiz':
        return <HelpCircle className="w-10 h-10" />;
      case 'reading':
        return <BookOpen className="w-10 h-10" />;
      case 'click_game':
        return <Gamepad2 className="w-10 h-10" />;
      default:
        return <Star className="w-10 h-10" />;
    }
  };

  const getContentStyle = (type: ContentType) => {
    switch (type) {
      case 'quiz':
        return {
          gradient: 'from-blue-400 to-cyan-400',
          border: 'border-blue-300',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          shadow: 'shadow-blue-200'
        };
      case 'reading':
        return {
          gradient: 'from-green-400 to-emerald-400',
          border: 'border-green-300',
          bg: 'bg-green-50',
          text: 'text-green-600',
          shadow: 'shadow-green-200'
        };
      case 'click_game':
        return {
          gradient: 'from-purple-400 to-pink-400',
          border: 'border-purple-300',
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          shadow: 'shadow-purple-200'
        };
      default:
        return {
          gradient: 'from-yellow-400 to-orange-400',
          border: 'border-yellow-300',
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          shadow: 'shadow-yellow-200'
        };
    }
  };

  const getTypeEmoji = (type: ContentType) => {
    switch (type) {
      case 'quiz': return '🧠';
      case 'reading': return '📚';
      case 'click_game': return '🎮';
      default: return '⭐';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen fun-bg flex items-center justify-center">
        <div className="text-center animate-pop">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 mb-6 shadow-lg animate-bounce-slow">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Loading awesome stuff...
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="text-3xl animate-bounce" style={{ animationDelay: '0s' }}>🌟</span>
            <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
            <span className="text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>⭐</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen fun-bg flex items-center justify-center p-4">
        <div className="fun-card p-8 text-center max-w-md animate-pop">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-pink-400 mb-6 shadow-lg">
            <span className="text-4xl">😅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Oops! Something went wrong
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadContent}
            className="fun-button btn-mint"
          >
            <span className="flex items-center gap-2">
              <span>Try Again</span>
              <Rocket className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen fun-bg relative">
      {/* Floating Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <Sun className="absolute top-4 right-8 w-16 h-16 text-yellow-400 animate-float opacity-40" />
        <Cloud className="absolute top-20 left-8 w-12 h-12 text-blue-200 animate-float opacity-30" style={{ animationDelay: '1s' }} />
        <Star className="absolute top-1/4 right-16 w-8 h-8 text-pink-300 animate-sparkle opacity-40" />
        <Heart className="absolute bottom-1/4 left-12 w-10 h-10 text-red-200 animate-bounce-slow opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b-4 border-yellow-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold rainbow-text" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Growing Good
                </h1>
                <p className="text-xs text-gray-400 -mt-1">Learn & Play!</p>
              </div>
            </Link>

            {/* User Section */}
            <div className="flex items-center gap-3">
              <Link
                to="/leaderboard"
                className="fun-button btn-coral text-sm py-2 px-4 flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="fun-button btn-lavender text-sm py-2 px-4 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              
              <button
                onClick={() => setShowProfileEdit(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full py-2 px-4 border-2 border-yellow-200 hover:from-yellow-100 hover:to-orange-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-bold text-gray-700 hidden sm:inline">{user?.username}</span>
              </button>

              <button
                onClick={logout}
                className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Welcome Banner */}
        <div className="fun-card p-6 mb-8 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border-4 border-yellow-200 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-lg animate-bounce-slow">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Welcome back, {user?.username}! 🎉
              </h2>
              <p className="text-gray-500 mt-1">Ready to learn something amazing today?</p>
            </div>
            <div className="flex gap-2">
              <span className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🌟</span>
              <span className="text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>📚</span>
              <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎮</span>
            </div>
          </div>
        </div>

        {journey && (
          <section className="mb-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="fun-card border-4 border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Next Best Steps
                  </h3>
                  <p className="text-sm text-gray-500">{journey.focus_message}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {journey.recommendations.map((entry) => {
                  const style = getContentStyle(entry.content.content_type);
                  return (
                    <Link
                      key={entry.content.id}
                      to={`/content/${entry.content.id}`}
                      className={`rounded-3xl border-4 ${style.border} bg-white/80 p-5 shadow-sm transition-transform hover:-translate-y-1`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-lg`}>
                          {getContentIcon(entry.content.content_type)}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
                          {getTypeEmoji(entry.content.content_type)} Match {entry.match_score}
                        </span>
                      </div>
                      <h4 className="mb-2 text-lg font-bold text-gray-800">{entry.content.title}</h4>
                      <p className="mb-4 text-sm text-gray-500">
                        {entry.content.description || 'A tailored activity picked from your learning journey.'}
                      </p>
                      <div className="mb-4 rounded-2xl bg-blue-50 px-3 py-2 text-sm text-blue-700">
                        {entry.reason}
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-500">
                        <span className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          {formatDuration(entry.estimated_duration_seconds)}
                        </span>
                        <span className="flex items-center gap-2 text-green-600">
                          <Rocket className="h-4 w-4" />
                          Start
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="fun-card border-4 border-orange-200 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-400 shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Focus Areas
                  </h3>
                  <p className="text-sm text-gray-500">Updated from score, pace, and completion history.</p>
                </div>
              </div>

              {journey.weak_areas.length > 0 ? (
                <div className="space-y-3">
                  {journey.weak_areas.map((area) => (
                    <div key={area.category_name} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-bold text-gray-700">{area.category_name}</p>
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                          {area.attempt_count} tries
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Avg score {Math.round(area.average_score)}%
                        {area.average_duration_seconds
                          ? ` • Avg pace ${formatDuration(Math.round(area.average_duration_seconds))}`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/80 p-4 text-sm text-gray-500 shadow-sm">
                  Complete a few activities and this panel will start spotting patterns automatically.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section Title */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Choose Your Adventure!
          </h2>
          <Sparkles className="w-8 h-8 text-yellow-400 animate-sparkle" />
        </div>

        {/* Content Grid */}
        {content.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item, index) => {
              const style = getContentStyle(item.content_type);
              return (
                <Link
                  key={item.id}
                  to={`/content/${item.id}`}
                  className={`fun-card p-6 border-4 ${style.border} ${style.shadow} group animate-fade-in-up opacity-0`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Icon Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <span className="text-white">{getContentIcon(item.content_type)}</span>
                    </div>
                    <span className={`${style.bg} ${style.text} px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1`}>
                      <span>{getTypeEmoji(item.content_type)}</span>
                      <span className="capitalize">{item.content_type.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Content Info */}
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-600 transition-colors" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-500 mb-4 line-clamp-2">
                    {item.description || 'Click to start your adventure!'}
                  </p>

                  {/* Action Footer */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-gray-100">
                    <span className={`font-bold ${style.text} flex items-center gap-1`}>
                      <Rocket className="w-4 h-4" />
                      Start Now!
                    </span>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="fun-card p-12 text-center animate-pop">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              No Adventures Yet!
            </h3>
            <p className="text-gray-400">
              Check back soon for fun learning activities! 🌟
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-400 text-sm">
        <p>🌟 Growing Good - Learning Manners Through Fun! 🌈</p>
      </footer>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        user={user || { id: 0, username: '' }}
        onUpdate={handleUpdateUser}
      />
    </div>
  );
};

export default Dashboard;
