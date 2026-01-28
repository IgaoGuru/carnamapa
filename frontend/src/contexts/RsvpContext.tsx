import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getUserRsvps,
  createRsvp,
  deleteRsvp,
} from '../services/rsvpService';

interface RsvpContextValue {
  rsvpEventIds: Set<string>;
  isLoading: boolean;
  addRsvp: (eventId: string) => Promise<void>;
  removeRsvp: (eventId: string) => Promise<void>;
  refreshRsvps: () => Promise<void>;
}

const RsvpContext = createContext<RsvpContextValue | null>(null);

interface RsvpProviderProps {
  children: ReactNode;
}

export function RsvpProvider({ children }: RsvpProviderProps) {
  const [rsvpEventIds, setRsvpEventIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refreshRsvps = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventIds = await getUserRsvps();
      setRsvpEventIds(new Set(eventIds));
    } catch (error) {
      console.error('Failed to fetch RSVPs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRsvp = useCallback(async (eventId: string) => {
    // Optimistic update
    setRsvpEventIds((prev) => new Set([...prev, eventId]));

    try {
      await createRsvp(eventId);
    } catch (error) {
      // Revert optimistic update on error
      setRsvpEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      throw error;
    }
  }, []);

  const removeRsvp = useCallback(async (eventId: string) => {
    // Optimistic update
    setRsvpEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });

    try {
      await deleteRsvp(eventId);
    } catch (error) {
      // Revert optimistic update on error
      setRsvpEventIds((prev) => new Set([...prev, eventId]));
      throw error;
    }
  }, []);

  useEffect(() => {
    refreshRsvps();
  }, [refreshRsvps]);

  return (
    <RsvpContext.Provider
      value={{
        rsvpEventIds,
        isLoading,
        addRsvp,
        removeRsvp,
        refreshRsvps,
      }}
    >
      {children}
    </RsvpContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRsvpContext(): RsvpContextValue {
  const context = useContext(RsvpContext);
  if (!context) {
    throw new Error('useRsvpContext must be used within a RsvpProvider');
  }
  return context;
}
