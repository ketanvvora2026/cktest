import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-white rounded-2xl border border-border shadow-lg p-2 transition-shadow focus-within:shadow-xl focus-within:border-primary/50"
      >
        <div className="flex items-center self-stretch pl-3 pr-1 text-primary/60">
          <Sparkles size={20} />
        </div>
        
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Azure AI Foundry agent..."
          className="flex-1 min-h-[24px] max-h-[200px] border-0 focus-visible:ring-0 px-0 py-3 shadow-none bg-transparent resize-none overflow-y-auto"
          disabled={disabled}
          rows={1}
        />
        
        <div className="flex self-end mb-1 mr-1">
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || disabled}
            className="rounded-xl h-10 w-10 transition-all active:scale-95"
          >
            <Send size={18} className="ml-0.5" />
          </Button>
        </div>
      </form>
      <div className="text-center mt-3 mb-2">
        <p className="text-[11px] text-muted-foreground font-medium">
          Azure AI Chat can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
};
