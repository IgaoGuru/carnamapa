import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  getUserRsvps,
  createRsvp,
  deleteRsvp,
} from '../services/rsvpService';
import { useUrlParams } from '../hooks/useUrlParams';

interface RsvpContextValue {
  rsvpEventIds: Set<string>;
  isLoading: boolean;
  addRsvp: (eventId: string) => Promise<void>;
  removeRsvp: (eventId: string) => Promise<void>;
  refreshRsvps: () => Promise<void>;
  getBlocosFromUrl: () => string[];
}

const RsvpContext = createContext<RsvpContextValue | null>(null);

interface RsvpProviderProps {
  children: ReactNode;
}

export function RsvpProvider({ children }: RsvpProviderProps) {
  const [rsvpEventIds, setRsvpEventIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { getParams, setParams } = useUrlParams();
  const isInitialLoad = useRef(true);

  // Get blocos from URL for merging (used by components on initial load)
  const getBlocosFromUrl = useCallback((): string[] => {
    const { blocos } = getParams();
    if (!blocos) return [];
    return blocos.split(',').filter((id) => id.trim() !== '');
  }, [getParams]);

  // Sync RSVPs to URL whenever they change (after initial load)
  useEffect(() => {
    if (isInitialLoad.current) return;

    const blocosArray = Array.from(rsvpEventIds);
    const blocosParam = blocosArray.length > 0 ? blocosArray.join(',') : undefined;
    setParams({ blocos: blocosParam });
  }, [rsvpEventIds, setParams]);

  const refreshRsvps = useCallback(async () => {
    setIsLoading(true);
    try {
      const eventIds = await getUserRsvps();
      setRsvpEventIds(new Set(eventIds));
    } catch (error) {
      console.error('Failed to fetch RSVPs:', error);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
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
        getBlocosFromUrl,
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
