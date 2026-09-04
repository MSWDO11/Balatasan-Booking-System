"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Kira 👋 your Balatasan Resort assistant. Ask me anything about our cottages, island hopping, water activities, or how to book!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again shortly.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[350px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-slate-100 bg-white flex flex-col overflow-hidden"
          style={{ height: 480 }}>
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Kira</p>
                <p className="text-[10px] text-white/70 leading-tight">Balatasan Resort Assistant</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2 items-end", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "assistant" ? "bg-primary/10" : "bg-slate-100"
                )}>
                  {msg.role === "assistant"
                    ? <Bot className="h-3.5 w-3.5 text-primary" />
                    : <User className="h-3.5 w-3.5 text-slate-500" />
                  }
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-slate-100 text-slate-800 rounded-bl-sm"
                    : "bg-primary text-white rounded-br-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-end">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
