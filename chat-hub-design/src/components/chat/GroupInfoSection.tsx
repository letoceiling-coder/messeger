import { useState, useEffect } from 'react';
import { UserPlus, LogOut, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/common/Avatar';
import { useChats, type ChatDetails } from '@/context/ChatsContext';
import { useAuth } from '@/context/AuthContext';
import AddContactSheet from '@/components/contacts/AddContactSheet';
import { cn } from '@/lib/utils';

interface GroupInfoSectionProps {
  chatId: string;
  chatName: string;
  onClose: () => void;
  onLeave: () => void;
}

export default function GroupInfoSection({
  chatId,
  chatName,
  onClose,
  onLeave,
}: GroupInfoSectionProps) {
  const { user } = useAuth();
  const { fetchChatDetails, addMember, removeMember, leaveGroup } = useChats();
  const [details, setDetails] = useState<ChatDetails | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  useEffect(() => {
    fetchChatDetails(chatId).then(setDetails);
  }, [chatId, fetchChatDetails]);

  const myMember = details?.members.find((m) => m.userId === user?.id);
  const isAdmin = myMember?.role === 'admin';

  const handleAddMember = async (contact: { id: string }) => {
    if (details?.members.some((m) => m.userId === contact.id)) return;
    const ok = await addMember(chatId, contact.id);
    if (ok) {
      setAddMemberOpen(false);
      fetchChatDetails(chatId).then(setDetails);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(chatId, userId);
    fetchChatDetails(chatId).then(setDetails);
  };

  const handleLeave = async () => {
    const ok = await leaveGroup(chatId);
    if (ok) {
      onClose();
      onLeave();
    }
  };

  if (!details) return <p className="px-4 py-2 text-sm text-muted-foreground">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <h3 className="px-4 text-sm font-medium text-muted-foreground">Участники ({details.members.length})</h3>
      <div className="space-y-1">
        {details.members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50"
          >
            <UserAvatar
              src={m.user.avatarUrl ?? undefined}
              name={m.user.username || m.userId}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{m.user.username || m.userId}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {m.role === 'admin' ? (
                  <>
                    <Crown className="h-3 w-3" />
                    Администратор
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3" />
                    Участник
                  </>
                )}
              </p>
            </div>
            {isAdmin && m.userId !== user?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRemoveMember(m.userId)}
              >
                Удалить
              </Button>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="px-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setAddMemberOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Добавить участника
          </Button>
        </div>
      )}

      <div className="px-4 border-t border-border pt-4">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/50 hover:bg-destructive/10 gap-2"
          onClick={handleLeave}
        >
          <LogOut className="h-4 w-4" />
          Покинуть группу
        </Button>
      </div>

      <AddContactSheet
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onSelect={handleAddMember}
      />
    </div>
  );
}
