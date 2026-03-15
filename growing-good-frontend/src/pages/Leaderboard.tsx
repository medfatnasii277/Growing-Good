import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import type { LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, Star, ArrowLeft, User } from 'lucide-react';
import { getErrorMessage } from '../utils/errors';

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const [response, rankResponse] = await Promise.all([
        leaderboardAPI.getLeaderboard(20),
        leaderboardAPI.getMyRank(),
      ]);
      setEntries(response.data.entries);
      setUserRank(rankResponse.data.rank);
      setUserScore(rankResponse.data.total_score);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load leaderboard'));
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Leaderboard
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {user && userRank && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Your Ranking</p>
                  <p className="text-3xl font-bold text-indigo-600">#{userRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">Total Score</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {userScore}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-6 h-6" />
              <h2 className="text-xl font-bold">Top Players</h2>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No players yet. Be the first to complete some challenges!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${getRankStyle(entry.rank)}`}
                >
                  <div className="w-10 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{entry.username}</p>
                    <p className="text-sm text-gray-500">
                      {entry.completed_count} completed
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-600">{entry.total_score}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
