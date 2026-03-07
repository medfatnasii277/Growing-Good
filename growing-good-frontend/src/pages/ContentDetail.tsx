import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ContentItem, QuizData, ReadingData, ClickGameData } from '../types';
import { 
  ArrowLeft, Star, CheckCircle, BookOpen, HelpCircle, Gamepad2,
  Sparkles, Sun, Cloud, Heart, Trophy, Home, Clock, Lightbulb,
  Target, PartyPopper, Rocket
} from 'lucide-react';

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [gameItems, setGameItems] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    loadContent();
  }, [id]);

  // Timer for click game
  useEffect(() => {
    if (content?.content_type === 'click_game' && !completed && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !completed && content?.content_type === 'click_game') {
      handleGameComplete();
    }
  }, [timeLeft, completed, content]);

  const loadContent = async () => {
    try {
      const response = await contentAPI.get(Number(id));
      setContent(response.data);
      if (response.data.content_type === 'click_game') {
        const data = response.data.data as ClickGameData;
        setGameItems([...data.correct_items, ...data.wrong_items].sort(() => Math.random() - 0.5));
        setTimeLeft(data.time_limit_seconds);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!content) return;
    const quizData = content.data as QuizData;
    const isCorrect = selectedAnswer === quizData.questions[currentQuestion].correct_index;
    
    setShowFeedback(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(async () => {
      setShowFeedback(null);
      
      if (isCorrect) {
        setScore(score + 1);
      }

      if (currentQuestion < quizData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        const finalScore = Math.round(((score + (isCorrect ? 1 : 0)) / quizData.questions.length) * 100);
        try {
          await contentAPI.complete(content.id, finalScore);
          setCompleted(true);
        } catch (error: any) {
          setError(error.message || 'Failed to complete quiz');
        }
      }
    }, 1000);
  };

  const handleReadingComplete = async () => {
    if (!content) return;
    try {
      await contentAPI.complete(content.id, 100);
      setCompleted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to complete reading');
    }
  };

  const handleGameItemClick = async (item: string) => {
    if (!content) return;
    const gameData = content.data as ClickGameData;
    
    if (gameData.correct_items.includes(item)) {
      const newItems = gameItems.filter(i => i !== item);
      setGameItems(newItems);
      
      if (newItems.filter(i => gameData.correct_items.includes(i)).length === 0) {
        const finalScore = Math.round((timeLeft / gameData.time_limit_seconds) * 100);
        try {
          await contentAPI.complete(content.id, finalScore);
          setCompleted(true);
        } catch (error: any) {
          setError(error.message || 'Failed to complete game');
        }
      }
    }
  };

  const handleGameComplete = async () => {
    if (!content) return;
    const gameData = content.data as ClickGameData;
    const remainingCorrect = gameItems.filter(i => gameData.correct_items.includes(i)).length;
    const finalScore = Math.round((1 - remainingCorrect / gameData.correct_items.length) * 100);
    try {
      await contentAPI.complete(content.id, Math.max(0, finalScore));
      setCompleted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to complete game');
    }
  };

  const getContentStyle = () => {
    switch (content?.content_type) {
      case 'quiz':
        return {
          gradient: 'from-blue-400 to-cyan-400',
          border: 'border-blue-300',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          emoji: '🧠'
        };
      case 'reading':
        return {
          gradient: 'from-green-400 to-emerald-400',
          border: 'border-green-300',
          bg: 'bg-green-50',
          text: 'text-green-600',
          emoji: '📚'
        };
      case 'click_game':
        return {
          gradient: 'from-purple-400 to-pink-400',
          border: 'border-purple-300',
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          emoji: '🎮'
        };
      default:
        return {
          gradient: 'from-yellow-400 to-orange-400',
          border: 'border-yellow-300',
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          emoji: '⭐'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen fun-bg flex items-center justify-center">
        <div className="text-center animate-pop">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 mb-6 shadow-lg animate-bounce-slow">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Loading your adventure...
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

  if (error || !content) {
    return (
      <div className="min-h-screen fun-bg flex items-center justify-center p-4">
        <div className="fun-card p-8 text-center max-w-md animate-pop">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-pink-400 mb-6 shadow-lg">
            <span className="text-4xl">😅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Oops! Something went wrong
          </h2>
          <p className="text-gray-500 mb-6">{error || 'Content not found'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadContent} className="fun-button btn-mint">
              Try Again
            </button>
            <button onClick={() => navigate('/')} className="fun-button btn-sky">
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const style = getContentStyle();

  return (
    <div className="min-h-screen fun-bg relative">
      {/* Floating Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <Sun className="absolute top-4 right-8 w-14 h-14 text-yellow-400 animate-float opacity-40" />
        <Cloud className="absolute top-20 left-8 w-10 h-10 text-blue-200 animate-float opacity-30" style={{ animationDelay: '1s' }} />
        <Star className="absolute top-1/4 right-16 w-6 h-6 text-pink-300 animate-sparkle opacity-40" />
        <Heart className="absolute bottom-1/4 left-12 w-8 h-8 text-red-200 animate-bounce-slow opacity-30" />
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b-4 border-yellow-300">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-bold hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                <span className="text-xl">{style.emoji}</span>
              </div>
              <h1 className="text-lg font-bold text-gray-700 truncate max-w-[200px]" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {content.title}
              </h1>
            </div>

            <Link to="/" className="w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 flex items-center justify-center transition-colors">
              <Home className="w-5 h-5 text-yellow-600" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {completed ? (
          <div className="fun-card p-8 text-center animate-pop border-4 border-green-300">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 mb-6 shadow-lg animate-bounce-slow">
              <PartyPopper className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Amazing Job! 🎉
            </h2>
            <p className="text-gray-500 text-lg mb-6">You completed this activity like a superstar!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => navigate('/')} className="fun-button btn-mint">
                <span className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Back Home
                </span>
              </button>
              <button onClick={() => { setCompleted(false); setCurrentQuestion(0); setScore(0); setSelectedAnswer(null); loadContent(); }} className="fun-button btn-sunshine">
                <span className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Play Again
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="fun-card p-6 md:p-8 border-4 border-gray-100">
            {content.content_type === 'quiz' && (
              <QuizView
                data={content.data as QuizData}
                currentQuestion={currentQuestion}
                selectedAnswer={selectedAnswer}
                setSelectedAnswer={setSelectedAnswer}
                onSubmit={handleQuizSubmit}
                showFeedback={showFeedback}
              />
            )}

            {content.content_type === 'reading' && (
              <ReadingView
                data={content.data as ReadingData}
                onComplete={handleReadingComplete}
              />
            )}

            {content.content_type === 'click_game' && (
              <ClickGameView
                data={content.data as ClickGameData}
                gameItems={gameItems}
                timeLeft={timeLeft}
                onItemClick={handleGameItemClick}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const QuizView = ({ data, currentQuestion, selectedAnswer, setSelectedAnswer, onSubmit, showFeedback }: {
  data: QuizData;
  currentQuestion: number;
  selectedAnswer: number | null;
  setSelectedAnswer: (i: number | null) => void;
  onSubmit: () => void;
  showFeedback: 'correct' | 'wrong' | null;
}) => {
  const question = data.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / data.questions.length) * 100;

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 font-bold">Question {currentQuestion + 1} of {data.questions.length}</span>
          <span className="text-blue-500 font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="fun-progress">
          <div className="fun-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {question.question}
          </h3>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          let optionStyle = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
          
          if (showFeedback) {
            if (index === question.correct_index) {
              optionStyle = 'border-green-400 bg-green-50';
            } else if (selectedAnswer === index) {
              optionStyle = 'border-red-400 bg-red-50';
            }
          } else if (selectedAnswer === index) {
            optionStyle = 'border-blue-400 bg-blue-50 scale-[1.02]';
          }

          return (
            <button
              key={index}
              onClick={() => !showFeedback && setSelectedAnswer(index)}
              disabled={showFeedback !== null}
              className={`w-full p-4 rounded-2xl border-3 text-left transition-all font-semibold ${optionStyle} ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedAnswer === index ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-gray-700">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback Animation */}
      {showFeedback && (
        <div className={`text-center py-4 mb-4 rounded-2xl animate-pop ${
          showFeedback === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          <span className="text-2xl mr-2">{showFeedback === 'correct' ? '🎉' : '😅'}</span>
          <span className="font-bold text-lg">{showFeedback === 'correct' ? 'Great Job!' : 'Oops! Try again next time!'}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={selectedAnswer === null || showFeedback !== null}
        className="fun-button btn-sky w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center justify-center gap-2">
          {currentQuestion < data.questions.length - 1 ? (
            <>
              <span>Next Question</span>
              <span>➡️</span>
            </>
          ) : (
            <>
              <span>Finish Quiz</span>
              <Trophy className="w-5 h-5" />
            </>
          )}
        </span>
      </button>
    </div>
  );
};

const ReadingView = ({ data, onComplete }: { data: ReadingData; onComplete: () => void }) => {
  return (
    <div>
      {/* Reading Info */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="fun-badge badge-mint">
          <Clock className="w-4 h-4" />
          <span>{data.reading_time_minutes} min read</span>
        </div>
        <div className="fun-badge badge-sunshine">
          <BookOpen className="w-4 h-4" />
          <span>Reading</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-700 mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
        {data.title}
      </h2>

      {/* Content */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border-2 border-green-200">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
          {data.content}
        </p>
      </div>

      {/* Moral */}
      {data.moral && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6 border-2 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-yellow-700 mb-1">Lesson Learned 💡</h4>
              <p className="text-yellow-600">{data.moral}</p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Button */}
      <button
        onClick={onComplete}
        className="fun-button btn-mint w-full text-lg"
      >
        <span className="flex items-center justify-center gap-2">
          <span>I Finished Reading!</span>
          <CheckCircle className="w-5 h-5" />
        </span>
      </button>
    </div>
  );
};

const ClickGameView = ({ data, gameItems, timeLeft, onItemClick }: {
  data: ClickGameData;
  gameItems: string[];
  timeLeft: number;
  onItemClick: (item: string) => void;
}) => {
  const formatItem = (item: string) => {
    return item.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const correctRemaining = gameItems.filter(i => data.correct_items.includes(i)).length;

  return (
    <div>
      {/* Timer and Score */}
      <div className="flex justify-between items-center mb-6">
        <div className="fun-badge badge-lavender">
          <Target className="w-4 h-4" />
          <span>{correctRemaining} safe items left</span>
        </div>
        <div className={`fun-badge ${timeLeft < 10 ? 'badge-coral animate-wiggle' : 'badge-sky'}`}>
          <Clock className="w-4 h-4" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Scenario */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-purple-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-purple-700 mb-1">Your Mission 🎯</h4>
            <p className="text-purple-600">{data.scenario}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mb-6">
        <p className="text-gray-500 font-semibold">
          👆 Tap all the <span className="text-green-500">SAFE</span> and <span className="text-green-500">GOOD</span> choices!
        </p>
      </div>

      {/* Game Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {gameItems.map((item) => (
          <button
            key={item}
            onClick={() => onItemClick(item)}
            className="fun-card p-4 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-center group"
          >
            <span className="text-gray-700 font-semibold group-hover:text-purple-600 transition-colors">
              {formatItem(item)}
            </span>
          </button>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Found: {data.correct_items.length - correctRemaining} / {data.correct_items.length} safe items
        </p>
      </div>
    </div>
  );
};

export default ContentDetail;