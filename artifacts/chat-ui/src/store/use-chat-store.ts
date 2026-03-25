import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Role = 'user' | 'agent' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface Thread {
  id: string;
  serverId?: string; // The ID provided by Azure AI Foundry
  title: string;
  messages: Message[];
  updatedAt: string;
}

interface ChatState {
  threads: Record<string, Thread>;
  activeThreadId: string | null;
  
  // Actions
  createThread: (serverId?: string) => string;
  setActiveThread: (id: string) => void;
  deleteThread: (id: string) => void;
  setThreadServerId: (localId: string, serverId: string) => void;
  addMessage: (threadId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (threadId: string, messageId: string, updates: Partial<Message>) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threads: {},
      activeThreadId: null,

      createThread: (serverId?: string) => {
        const id = uuidv4();
        const newThread: Thread = {
          id,
          serverId,
          title: 'New Conversation',
          messages: [],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          threads: { ...state.threads, [id]: newThread },
          activeThreadId: id,
        }));

        return id;
      },

      setActiveThread: (id: string) => {
        set({ activeThreadId: id });
      },

      deleteThread: (id: string) => {
        set((state) => {
          const newThreads = { ...state.threads };
          delete newThreads[id];
          
          let newActiveId = state.activeThreadId;
          if (newActiveId === id) {
            const remainingIds = Object.keys(newThreads);
            newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
          }

          return {
            threads: newThreads,
            activeThreadId: newActiveId,
          };
        });
      },

      setThreadServerId: (localId: string, serverId: string) => {
        set((state) => {
          const thread = state.threads[localId];
          if (!thread) return state;
          return {
            threads: {
              ...state.threads,
              [localId]: { ...thread, serverId },
            },
          };
        });
      },

      addMessage: (threadId: string, message) => {
        const id = uuidv4();
        const fullMessage: Message = {
          ...message,
          id,
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          const thread = state.threads[threadId];
          if (!thread) return state;

          // Auto-generate title from first user message if title is default
          let title = thread.title;
          if (thread.messages.length === 0 && message.role === 'user') {
            title = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '');
          }

          return {
            threads: {
              ...state.threads,
              [threadId]: {
                ...thread,
                title,
                messages: [...thread.messages, fullMessage],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });

        return id;
      },

      updateMessage: (threadId, messageId, updates) => {
        set((state) => {
          const thread = state.threads[threadId];
          if (!thread) return state;

          return {
            threads: {
              ...state.threads,
              [threadId]: {
                ...thread,
                messages: thread.messages.map((m) => 
                  m.id === messageId ? { ...m, ...updates } : m
                ),
              },
            },
          };
        });
      },

      updateThreadTitle: (threadId, title) => {
        set((state) => {
          const thread = state.threads[threadId];
          if (!thread) return state;
          return {
            threads: {
              ...state.threads,
              [threadId]: { ...thread, title },
            },
          };
        });
      },

      clearAll: () => {
        set({ threads: {}, activeThreadId: null });
      },
    }),
    {
      name: 'azure-ai-chat-storage',
    }
  )
);
