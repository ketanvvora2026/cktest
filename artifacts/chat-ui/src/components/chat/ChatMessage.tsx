import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Message } from '@/store/use-chat-store';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const isUser = message.role === 'user';
  
  // Animation config - only animate if it's the latest message entering
  const animConfig = isLatest ? {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' }
  } : {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      {...animConfig}
      className={cn(
        "flex w-full mb-8 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-4xl gap-4 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* Avatar */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : message.isError 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-white border border-border text-primary"
          )}>
            {isUser ? <User size={20} /> : message.isError ? <AlertCircle size={20} /> : <Bot size={20} />}
          </div>
        </div>

        {/* Message Bubble */}
        <div className={cn(
          "flex flex-col",
          isUser ? "items-end" : "items-start",
          "min-w-0" // Prevents overflow issues with long unbroken text
        )}>
          <div className="flex items-baseline gap-2 mb-1.5 px-1">
            <span className="text-sm font-semibold text-foreground">
              {isUser ? 'You' : 'Azure AI'}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
          </div>
          
          <div className={cn(
            "relative px-5 py-4 rounded-2xl text-sm shadow-sm max-w-full overflow-hidden",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : message.isError
                ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
                : "bg-white border border-border text-card-foreground rounded-tl-sm"
          )}>
            {message.content === '' && !isUser && !message.isError ? (
              <div className="flex items-center h-5 gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
