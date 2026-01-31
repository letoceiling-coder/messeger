import { useState, useEffect } from 'react';
import { User } from '../types';
import { usersService } from '../services/users.service';
import { chatsService } from '../services/chats.service';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupChatModal = ({ isOpen, onClose }: CreateGroupChatModalProps) => {
  const [step, setStep] = useState<'name' | 'members'>('name');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && step === 'members') {
      loadUsers();
    }
  }, [isOpen, step]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка загрузки пользователей', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!groupName.trim()) {
      showToast('Введите название группы', 'error');
      return;
    }
    setStep('members');
  };

  const handleBack = () => {
    setStep('name');
  };

  const toggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const handleCreate = async () => {
    if (selectedUserIds.size === 0) {
      showToast('Выберите хотя бы одного участника', 'error');
      return;
    }

    try {
      setLoading(true);
      const chat = await chatsService.createGroupChat(
        groupName.trim(),
        Array.from(selectedUserIds),
        description.trim() || undefined
      );
      showToast('Группа создана', 'success');
      onClose();
      navigate(`/chat/${chat.id}`);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка создания группы', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-app-surface rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text">
            {step === 'name' ? 'Новая группа' : 'Добавить участников'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-app-surface-hover transition-colors"
          >
            <svg className="w-5 h-5 text-app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="p-6">
          {step === 'name' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-text mb-2">Название группы</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Введите название..."
                  maxLength={100}
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl 
                           text-app-text placeholder-app-text-secondary
                           focus:outline-none focus:border-app-accent transition-colors"
                  autoFocus
                />
                <p className="text-xs text-app-text-secondary mt-1">{groupName.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-text mb-2">Описание (необязательно)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание группы..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl 
                           text-app-text placeholder-app-text-secondary resize-none
                           focus:outline-none focus:border-app-accent transition-colors"
                />
                <p className="text-xs text-app-text-secondary mt-1">{description.length}/500</p>
              </div>

              <button
                onClick={handleNext}
                disabled={!groupName.trim()}
                className="w-full py-3 bg-app-accent hover:bg-app-accent-hover text-white 
                         font-medium rounded-xl transition-colors disabled:opacity-50 
                         disabled:cursor-not-allowed"
              >
                Далее
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Поиск */}
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск пользователей..."
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl 
                           text-app-text placeholder-app-text-secondary
                           focus:outline-none focus:border-app-accent transition-colors"
                />
              </div>

              {/* Список пользователей */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {loading ? (
                  <p className="text-center text-app-text-secondary py-8">Загрузка...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-app-text-secondary py-8">Пользователи не найдены</p>
                ) : (
                  filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-app-bg 
                               cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="w-5 h-5 rounded border-app-border bg-app-bg 
                                 text-app-accent focus:ring-2 focus:ring-app-accent"
                      />
                      <div className="w-10 h-10 rounded-full bg-app-accent flex items-center justify-center shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-app-text truncate">{user.username}</p>
                        <p className="text-sm text-app-text-secondary truncate">{user.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Выбрано */}
              {selectedUserIds.size > 0 && (
                <p className="text-sm text-app-text-secondary">
                  Выбрано: {selectedUserIds.size} {selectedUserIds.size === 1 ? 'участник' : 'участников'}
                </p>
              )}

              {/* Кнопки */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 py-3 bg-app-surface-hover hover:bg-app-border text-app-text 
                           font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || selectedUserIds.size === 0}
                  className="flex-1 py-3 bg-app-accent hover:bg-app-accent-hover text-white 
                           font-medium rounded-xl transition-colors disabled:opacity-50 
                           disabled:cursor-not-allowed"
                >
                  {loading ? 'Создание...' : 'Создать группу'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
