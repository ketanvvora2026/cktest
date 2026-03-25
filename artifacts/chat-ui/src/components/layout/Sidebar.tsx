import React from 'react';
import { PlusCircle, MessageSquare, Trash2, Settings, User } from 'lucide-react';
import { useChatStore } from '@/store/use-chat-store';
import { useChatActions } from '@/hooks/use-chat-actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const Sidebar: React.FC = () => {
  const { threads, activeThreadId, setActiveThread, deleteThread } = useChatStore();
  const { handleStartNewChat, isCreatingThread } = useChatActions();

  // Sort threads by updated at descending
  const sortedThreads = Object.values(threads).sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="w-[280px] lg:w-[320px] bg-sidebar flex flex-col h-full border-r border-sidebar-border z-10">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="bg-primary text-white p-2 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"/>
            </svg>
          </div>
          <h1 className="font-bold text-lg text-sidebar-foreground">Azure AI Chat</h1>
        </div>
        
        <Button 
          onClick={handleStartNewChat} 
          disabled={isCreatingThread}
          className="w-full justify-start gap-2 shadow-sm bg-background text-foreground hover:bg-accent border border-border"
          variant="outline"
        >
          <PlusCircle size={18} />
          New Conversation
        </Button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent
        </div>
        
        {sortedThreads.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            No conversations yet.
          </div>
        ) : (
          sortedThreads.map(thread => (
            <div 
              key={thread.id}
              className={cn(
                "group relative flex flex-col items-start w-full p-3 rounded-xl cursor-pointer transition-colors text-left",
                activeThreadId === thread.id 
                  ? "bg-accent text-accent-foreground border border-border/50" 
                  : "hover:bg-secondary text-secondary-foreground border border-transparent"
              )}
              onClick={() => setActiveThread(thread.id)}
            >
              <div className="flex items-center w-full gap-3">
                <MessageSquare size={16} className={cn("shrink-0", activeThreadId === thread.id ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 truncate">
                  <span className="text-sm font-medium truncate block">
                    {thread.title}
                  </span>
                </div>
              </div>
              <div className="w-full pl-7 flex justify-between items-center mt-1">
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                </span>
              </div>
              
              {/* Delete button appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteThread(thread.id);
                }}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-destructive hover:text-white text-muted-foreground opacity-0 group-hover:opacity-100 transition-all",
                  activeThreadId === thread.id ? "opacity-100 bg-background/50" : ""
                )}
                title="Delete conversation"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Profile area */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Enterprise User</p>
            <p className="text-xs text-muted-foreground truncate">Replit Workspace</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
