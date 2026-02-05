import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/common/Avatar';
import { useChats } from '@/context/ChatsContext';
import { useContacts } from '@/context/ContactsContext';
import { Contact } from '@/types/messenger';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Страница создания группового чата с выбором участников */
const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { createGroupChat } = useChats();
  const { contacts } = useContacts();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableContacts = useMemo(() => {
    return contacts.filter((c) => !c.isBlocked);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return availableContacts;
    const q = searchQuery.toLowerCase();
    return availableContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [availableContacts, searchQuery]);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Введите название группы');
      return;
    }
    if (selectedIds.size === 0) {
      setError('Выберите хотя бы одного участника');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const chat = await createGroupChat(trimmedName, Array.from(selectedIds));
      if (chat) navigate(`/chat/${chat.id}`, { replace: true });
      else setError('Не удалось создать группу');
    } catch {
      setError('Не удалось создать группу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-2 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Новая группа</h1>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={loading || !name.trim() || selectedIds.size === 0}
          >
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            Название группы
          </label>
          <Input
            placeholder="Введите название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            Участники ({selectedIds.size})
          </label>
          <Input
            placeholder="Поиск контактов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          <div className="border border-border rounded-xl divide-y divide-border max-h-[50vh] overflow-y-auto">
            {filteredContacts.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggleContact(contact.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left transition-colors',
                    isSelected && 'bg-primary/10'
                  )}
                >
                  <UserAvatar
                    src={contact.avatar}
                    name={contact.name}
                    size="md"
                    isOnline={contact.isOnline}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    {contact.username && (
                      <p className="text-sm text-muted-foreground truncate">@{contact.username}</p>
                    )}
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/50'
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                </button>
              );
            })}
            {filteredContacts.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Контакты не найдены</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </motion.div>
    </div>
  );
};

export default CreateGroupPage;
