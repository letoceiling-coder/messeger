import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contact } from '@/types/messenger';
import { useContacts } from '@/context/ContactsContext';
interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (contact: Contact) => void;
}

export default function AddContactSheet({
  open,
  onOpenChange,
  onAdded,
}: AddContactSheetProps) {
  const { addContact } = useContacts();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const reset = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
  };

  const handleSave = () => {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || firstName.trim() || lastName.trim();
    if (!name.trim()) return;
    if (!phone.trim()) return;
    const contact = addContact({
      name,
      username: undefined,
      phone: phone.trim(),
      isOnline: false,
    });
    reset();
    onOpenChange(false);
    onAdded?.(contact);
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Новый контакт</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">Имя *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Имя"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Фамилия</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Фамилия"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Номер телефона *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 123-45-67"
            />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
