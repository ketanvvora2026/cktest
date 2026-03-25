import { useCallback } from 'react';
import { useSendMessage, useCreateThread } from '@workspace/api-client-react';
import { useChatStore } from '../store/use-chat-store';

export function useChatActions() {
  const { 
    activeThreadId, 
    threads, 
    createThread, 
    setThreadServerId, 
    addMessage, 
    updateMessage 
  } = useChatStore();

  const sendMessageMutation = useSendMessage();
  const createThreadMutation = useCreateThread();

  const handleStartNewChat = useCallback(async () => {
    // Optimistically create local thread
    const localId = createThread();
    
    try {
      const response = await createThreadMutation.mutateAsync();
      if (response?.threadId) {
        setThreadServerId(localId, response.threadId);
      }
    } catch (error) {
      console.error("Failed to create thread on server", error);
      // We still keep the local thread so the user can try sending a message, 
      // which will create a thread automatically if backend supports it.
    }
  }, [createThread, createThreadMutation, setThreadServerId]);

  const handleSendMessage = useCallback(async (content: string) => {
    let currentLocalThreadId = activeThreadId;

    // If no active thread, start one
    if (!currentLocalThreadId) {
      currentLocalThreadId = createThread();
    }

    const thread = threads[currentLocalThreadId];
    if (!thread) return;

    // 1. Add user message to UI immediately
    addMessage(currentLocalThreadId, { role: 'user', content });

    // 2. Add placeholder agent message to show loading state
    const agentMessageId = addMessage(currentLocalThreadId, { 
      role: 'agent', 
      content: '' 
    });

    try {
      // 3. Send to API
      const response = await sendMessageMutation.mutateAsync({
        data: {
          message: content,
          ...(thread.serverId ? { threadId: thread.serverId } : {})
        }
      });

      // 4. Update placeholder with real content
      updateMessage(currentLocalThreadId, agentMessageId, {
        content: response.reply
      });

      // Save the server thread ID if it was newly created
      if (!thread.serverId && response.threadId) {
        setThreadServerId(currentLocalThreadId, response.threadId);
      }

    } catch (error: any) {
      console.error("Error sending message:", error);
      updateMessage(currentLocalThreadId, agentMessageId, {
        content: "I'm sorry, I encountered an error while trying to respond. Please try again later.",
        isError: true
      });
    }
  }, [activeThreadId, threads, createThread, addMessage, sendMessageMutation, updateMessage, setThreadServerId]);

  return {
    handleStartNewChat,
    handleSendMessage,
    isSending: sendMessageMutation.isPending,
    isCreatingThread: createThreadMutation.isPending
  };
}
