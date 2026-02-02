import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import { useChats } from '@/context/ChatsContext';
import { useContacts } from '@/context/ContactsContext';
import { Contact } from '@/types/messenger';
import { motion, AnimatePresence } from 'framer-motion';
import SideMenu from '@/components/layout/SideMenu';
import ContactListItem from '@/components/contacts/ContactListItem';
import AddContactSheet from '@/components/contacts/AddContactSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const ContactsPage = () => {
  const navigate = useNavigate();
  const { chats } = useChats();
  const {
    contacts,
    pinContact,
    archiveContact,
    muteContact,
    blockContact,
    deleteContact,
  } = useContacts();

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [clearHistoryContact, setClearHistoryContact] = useState<Contact | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Spec 11.4: sort — pinned first, then online, then alphabet; filter blocked and optionally archived
  const { mainContacts, archivedContacts } = useMemo(() => {
    const notBlocked = contacts.filter((c) => !c.isBlocked);
    const main = notBlocked.filter((c) => !c.isArchived);
    const archived = notBlocked.filter((c) => c.isArchived);

    const filterBySearch = (list: Contact[]) => {
      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.username?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    };

    const sortContacts = (list: Contact[]) =>
      [...list].sort((a, b) => {
        if ((a.isPinned ?? false) && !(b.isPinned ?? false)) return -1;
        if (!(a.isPinned ?? false) && (b.isPinned ?? false)) return 1;
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.name.localeCompare(b.name);
      });

    return {
      mainContacts: sortContacts(filterBySearch(main)),
      archivedContacts: sortContacts(filterBySearch(archived)),
    };
  }, [contacts, searchQuery]);

  const handleContactClick = (contact: Contact) => {
    const chat = chats.find((c) => !c.isGroup && c.name === contact.name);
    if (chat) navigate(`/chat/${chat.id}`);
    else navigate('/');
  };

  const handleClearHistoryConfirm = () => {
    setClearHistoryContact(null);
    // In real app: clear messages with this contact
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header — spec 11.1: Burger (left), "Contacts", Search, Add Contact */}
      <header className="sticky top-0 z-40 bg-background border-b border-border pt-safe">
        <div className="flex items-center h-14 px-4 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            className="shrink-0"
          >
            <Menu className="h-6 w-6" />
          </Button>
          {!searchActive ? (
            <>
              <h1 className="text-xl font-semibold flex-1">Контакты</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchActive(true)}
                className="text-muted-foreground"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAddContactOpen(true)}
                className="text-primary"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex items-center gap-2"
              >
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="Поиск по имени, @username, телефону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 h-9 bg-transparent border-none focus-visible:ring-0 p-0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchActive(false);
                    setSearchQuery('');
                  }}
                >
                  Отмена
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {/* Inline search when not active as secondary row — spec 11.5 */}
        {!searchActive && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Поиск контактов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-none focus-visible:ring-1"
              />
            </div>
          </div>
        )}
      </header>

      {/* Stories — spec 11.3: horizontal scroll, round avatars, blue/gray ring */}
      <div className="border-b border-border overflow-x-auto scrollbar-none">
        <div className="flex gap-4 px-4 py-3 min-w-0">
          {mainContacts.slice(0, 8).map((contact, i) => (
            <button
              key={contact.id}
              type="button"
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div
                className={cn(
                  'rounded-full p-0.5',
                  i < 3 ? 'ring-2 ring-primary' : 'ring-2 ring-muted'
                )}
              >
                <UserAvatar name={contact.name} size="md" isOnline={contact.isOnline} />
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[56px]">
                {contact.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact list — spec 11.4: pinned, online, alphabet */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-4"
      >
        {mainContacts.length > 0 ? (
          <div className="divide-y divide-border">
            {mainContacts.map((contact) => (
              <ContactListItem
                key={contact.id}
                contact={contact}
                onClick={() => handleContactClick(contact)}
                onPin={(c) => pinContact(c.id, !(c.isPinned ?? false))}
                onArchive={(c) => archiveContact(c.id, !(c.isArchived ?? false))}
                onMute={(c) => muteContact(c.id, !(c.isMuted ?? false))}
                onBlock={(c) => blockContact(c.id, !(c.isBlocked ?? false))}
                onDelete={(c) => deleteContact(c.id)}
                onClearHistory={(c) => setClearHistoryContact(c)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'Контакты не найдены' : 'Нет контактов'}
            description={
              searchQuery
                ? 'Попробуйте изменить поисковый запрос'
                : 'Добавьте контакт, чтобы начать общение'
            }
            actionLabel={!searchQuery ? 'Добавить контакт' : undefined}
            onAction={!searchQuery ? () => setAddContactOpen(true) : undefined}
          />
        )}

        {/* Archived — spec 11.8: separate block, pull to show */}
        {archivedContacts.length > 0 && (
          <div className="mt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-muted-foreground"
            >
              Архивированные ({archivedContacts.length})
            </button>
            {showArchived && (
              <div className="divide-y divide-border">
                {archivedContacts.map((contact) => (
                  <ContactListItem
                    key={contact.id}
                    contact={contact}
                    onClick={() => handleContactClick(contact)}
                    onPin={(c) => pinContact(c.id, !(c.isPinned ?? false))}
                    onArchive={(c) => archiveContact(c.id, false)}
                    onMute={(c) => muteContact(c.id, !(c.isMuted ?? false))}
                    onBlock={(c) => blockContact(c.id, !(c.isBlocked ?? false))}
                    onDelete={(c) => deleteContact(c.id)}
                    onClearHistory={(c) => setClearHistoryContact(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <AddContactSheet open={addContactOpen} onOpenChange={setAddContactOpen} />

      {/* Clear History — spec 11.10: Clear for me / Clear for everyone */}
      <AlertDialog open={!!clearHistoryContact} onOpenChange={(open) => !open && setClearHistoryContact(null)}>
        <AlertDialogContent className="rounded-2xl shadow-modal max-w-[calc(100%-32px)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить историю?</AlertDialogTitle>
            <AlertDialogDescription>
              История переписки с {clearHistoryContact?.name} будет удалена. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistoryConfirm} className="w-full sm:w-auto">
              Очистить у меня
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                handleClearHistoryConfirm();
                // В реальном приложении: очистка для всех (если разрешено)
              }}
              className="w-full sm:w-auto border bg-background hover:bg-secondary text-foreground"
            >
              Очистить у всех
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactsPage;
