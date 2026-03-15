import { useState, useEffect, type FormEvent } from 'react';
import { authAPI } from '../services/api';
import { X } from 'lucide-react';
import type { User } from '../types';
import { getErrorMessage } from '../utils/errors';

const AVATAR_OPTIONS = [
  '/profile-pics/avatar-1.svg',
  '/profile-pics/avatar-2.svg',
  '/profile-pics/avatar-3.svg',
  '/profile-pics/avatar-4.svg',
  '/profile-pics/avatar-5.svg',
  '/profile-pics/avatar-6.svg',
];

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Pick<User, 'id' | 'username' | 'avatar'>;
  onUpdate: (user: Pick<User, 'id' | 'username' | 'avatar'>) => void;
}

const ProfileEditModal = ({ isOpen, onClose, user, onUpdate }: ProfileEditModalProps) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername(user.username);
      setAvatar(user.avatar || '');
      setError('');
    }
  }, [isOpen, user.username, user.avatar]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const updates: { username?: string; avatar?: string } = {};
    
    if (username.trim() !== user.username.trim()) {
      updates.username = username.trim();
    }
    if (avatar !== (user.avatar || '')) {
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length === 0) {
      setLoading(false);
      onClose();
      return;
    }

    try {
      const response = await authAPI.updateProfile(updates);
      
      onUpdate({
        id: response.data.id,
        username: response.data.username,
        avatar: response.data.avatar,
      });
      onClose();
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-pop">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAvatar(option)}
                  className={`p-2 rounded-xl border-4 transition-all ${
                    avatar === option
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={option}
                    alt="Avatar option"
                    className="w-16 h-16 mx-auto"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your username"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl hover:from-green-500 hover:to-emerald-600 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
