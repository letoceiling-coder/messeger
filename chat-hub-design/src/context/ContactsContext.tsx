import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Contact } from '@/types/messenger';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface ApiUser {
  id: string;
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

interface ContactsContextValue {
  contacts: Contact[];
  contactsLoading: boolean;
  searchContacts: (query: string) => Promise<Contact[]>;
  refreshContacts: () => Promise<void>;
  pinContact: (id: string, pinned: boolean) => void;
  archiveContact: (id: string, archived: boolean) => void;
  muteContact: (id: string, muted: boolean) => void;
  blockContact: (id: string, blocked: boolean) => void;
  deleteContact: (id: string) => void;
  getContactById: (id: string) => Contact | undefined;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

function mapApiUserToContact(u: ApiUser): Contact {
  return {
    id: u.id,
    name: u.username || u.email || 'Пользователь',
    username: u.username,
    avatar: u.avatarUrl ?? undefined,
    isOnline: u.isOnline ?? false,
    lastSeen: u.lastSeenAt ? new Date(u.lastSeenAt) : undefined,
    isPinned: false,
    isArchived: false,
    isMuted: false,
    isBlocked: false,
  };
}

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!user?.id) return;
    setContactsLoading(true);
    try {
      const data = await api.get<ApiUser[]>('/users');
      const list = Array.isArray(data) ? data : [];
      setContacts(list.map(mapApiUserToContact));
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadContacts();
    else setContacts([]);
  }, [user?.id, loadContacts]);

  const searchContacts = useCallback(async (query: string): Promise<Contact[]> => {
    if (!query.trim()) return [];
    try {
      const data = await api.get<ApiUser[]>(`/users/search?q=${encodeURIComponent(query.trim())}`);
      return (Array.isArray(data) ? data : []).map(mapApiUserToContact);
    } catch {
      return [];
    }
  }, []);

  const refreshContacts = useCallback(() => loadContacts(), [loadContacts]);

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

  const getContactById = useCallback(
    (id: string) => contacts.find((c) => c.id === id),
    [contacts]
  );

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts,
      contactsLoading,
      searchContacts,
      refreshContacts,
      pinContact,
      archiveContact,
      muteContact,
      blockContact,
      deleteContact,
      getContactById,
    }),
    [
      contacts,
      contactsLoading,
      searchContacts,
      refreshContacts,
      pinContact,
      archiveContact,
      muteContact,
      blockContact,
      deleteContact,
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
