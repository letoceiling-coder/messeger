import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Contact } from '@/types/messenger';
import { contacts as initialContacts } from '@/data/mockData';

interface ContactsContextValue {
  contacts: Contact[];
  pinContact: (id: string, pinned: boolean) => void;
  archiveContact: (id: string, archived: boolean) => void;
  muteContact: (id: string, muted: boolean) => void;
  blockContact: (id: string, blocked: boolean) => void;
  deleteContact: (id: string) => void;
  addContact: (contact: Omit<Contact, 'id'> & { id?: string }) => Contact;
  getContactById: (id: string) => Contact | undefined;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

function withDefaults(c: Contact): Contact {
  return {
    ...c,
    isPinned: c.isPinned ?? false,
    isArchived: c.isArchived ?? false,
    isMuted: c.isMuted ?? false,
    isBlocked: c.isBlocked ?? false,
  };
}

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(() =>
    initialContacts.map(withDefaults)
  );

  const pinContact = useCallback((id: string, pinned: boolean) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: pinned } : c))
    );
  }, []);

  const archiveContact = useCallback((id: string, archived: boolean) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: archived } : c))
    );
  }, []);

  const muteContact = useCallback((id: string, muted: boolean) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isMuted: muted } : c))
    );
  }, []);

  const blockContact = useCallback((id: string, blocked: boolean) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isBlocked: blocked } : c))
    );
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addContact = useCallback(
    (contact: Omit<Contact, 'id'> & { id?: string }): Contact => {
      const id = contact.id ?? `contact-${Date.now()}`;
      const newContact: Contact = withDefaults({
        ...contact,
        id,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        isBlocked: false,
      });
      setContacts((prev) => [...prev, newContact]);
      return newContact;
    },
    []
  );

  const getContactById = useCallback(
    (id: string) => contacts.find((c) => c.id === id),
    [contacts]
  );

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts,
      pinContact,
      archiveContact,
      muteContact,
      blockContact,
      deleteContact,
      addContact,
      getContactById,
    }),
    [
      contacts,
      pinContact,
      archiveContact,
      muteContact,
      blockContact,
      deleteContact,
      addContact,
      getContactById,
    ]
  );

  return (
    <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
}
