import React, { useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore } from '@/store/use-chat-store';
import { useChatActions } from '@/hooks/use-chat-actions';
import { motion, AnimatePresence } from 'framer-motion';

export const ChatPage: React.FC = () => {
  const { threads, activeThreadId } = useChatStore();
  const { handleSendMessage, isSending } = useChatActions();
  const activeThread = activeThreadId ? threads[activeThreadId] : null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-20 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-30 md:hidden flex"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Header - Glassmorphism */}
        <header className="absolute top-0 w-full z-10 glass-panel border-b-0 px-4 py-3 flex items-center gap-3">
          <button 
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 font-medium text-foreground truncate">
            {activeThread?.title || 'New Conversation'}
          </div>
          <div className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium border border-border">
            Azure Foundry Agent
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-20 pb-4 scroll-smooth">
          <div className="max-w-4xl mx-auto h-full flex flex-col justify-end">
            {!activeThread || activeThread.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-500 pb-10">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-primary/20">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">I'm your Planning Agent - How can I help you today?</h2>
                <p className="text-muted-foreground max-w-[500px]">
                  I am connected to your Azure AI Foundry project. Ask me anything, or type a prompt below to get started.
                </p>
              </div>
            ) : (
              <div className="flex flex-col mt-auto pt-4">
                {activeThread.messages.map((msg, idx) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    isLatest={idx === activeThread.messages.length - 1} 
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 pb-4 md:px-8 bg-gradient-to-t from-background via-background to-transparent pt-4">
          <ChatInput onSend={handleSendMessage} disabled={isSending} />
        </div>
      </div>
    </div>
  );
};
