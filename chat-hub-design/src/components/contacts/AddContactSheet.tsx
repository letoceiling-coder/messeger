import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Contact } from '@/types/messenger';
import { useContacts } from '@/context/ContactsContext';
import UserAvatar from '@/components/common/Avatar';

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (contact: Contact) => void;
}

export default function AddContactSheet({
  open,
  onOpenChange,
  onSelect,
}: AddContactSheetProps) {
  const { searchContacts } = useContacts();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const list = await searchContacts(query.trim());
      setResults(list);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (contact: Contact) => {
    onSelect?.(contact);
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Найти пользователя</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Username или email"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? '...' : 'Найти'}
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <UserAvatar src={c.avatar} name={c.name} size="md" isOnline={c.isOnline} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  {c.username && <p className="text-sm text-muted-foreground truncate">@{c.username}</p>}
                </div>
              </button>
            ))}
            {results.length === 0 && query && !searching && (
              <p className="text-sm text-muted-foreground py-4">Пользователи не найдены</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
