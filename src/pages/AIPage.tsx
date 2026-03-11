import React, { useState } from 'react';
import { Bot, Send, Plus } from 'lucide-react';

const AIPage: React.FC = () => {
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 p-4">
      {/* Chat Container */}
      <div className="bg-card rounded-2xl shadow-sm border border-border flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-inner">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-foreground">Gemini AI</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground text-[13px] font-medium transition-all duration-200">
            <Plus size={16} />
            Đoạn chat mới
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-primary bg-card shrink-0 shadow-sm mt-1">
              <Bot size={18} />
            </div>
            <div className="space-y-1 max-w-[85%]">
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-[14px] text-foreground leading-relaxed">
                  Xin chào! Tôi là Gemini. Tôi có thể giúp gì cho công việc của bạn hôm nay?
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground ml-1">23:49</span>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border bg-card">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="w-full bg-muted border-none rounded-xl px-5 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-12"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button 
              className="absolute right-2 p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              disabled={!message.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
