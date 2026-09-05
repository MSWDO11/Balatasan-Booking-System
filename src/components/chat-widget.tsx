"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Waves, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Render simple markdown links [text](url)
function renderMessage(content: string) {
  const parts = content.split(/(\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      return <Link key={i} href={match[2]} className="text-primary font-semibold underline underline-offset-2">{match[1]}</Link>;
    }
    return <span key={i}>{part}</span>;
  });
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "What cottages are available?",
  "Island hopping prices?",
  "How do I book?",
  "Water activities?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Kira 🌊 your Balatasan Resort assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, minimized]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    setShowQuickReplies(false);
    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (!open || minimized) setUnreadCount(c => c + 1);

      // Booking intent detection — if reply mentions booking, show a CTA
      const bookingKeywords = ["book", "reserve", "booking", "reservation", "accommodations", "cottages", "tours"];
      const replyLower = (data.reply as string).toLowerCase();
      if (bookingKeywords.some(k => replyLower.includes(k))) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "👉 Ready to book? [Browse Accommodations](/accommodations) or [View Tours](/accommodations#tours)",
          }]);
        }, 800);
      }
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
        <div
          className={cn(
            "fixed bottom-24 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl shadow-2xl border border-slate-100 bg-white flex flex-col overflow-hidden transition-all duration-300",
            minimized ? "h-[64px]" : "h-[520px]"
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-teal-400 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Avatar with online dot */}
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                  <Waves className="h-4 w-4 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Kira</p>
                <p className="text-[10px] text-white/80 leading-tight flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Online · Balatasan Resort
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(v => !v)}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2.5 items-end", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {/* Avatar */}
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-primary to-teal-400"
                        : "bg-slate-200"
                    )}>
                      {msg.role === "assistant"
                        ? <Waves className="h-3.5 w-3.5 text-white" />
                        : <User className="h-3.5 w-3.5 text-slate-500" />
                      }
                    </div>
                    {/* Bubble */}
                    <div className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                      msg.role === "assistant"
                        ? "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                        : "bg-primary text-white rounded-br-sm"
                    )}>
                      {renderMessage(msg.content)}
                      <p className={cn(
                        "text-[10px] mt-1 leading-none",
                        msg.role === "assistant" ? "text-slate-400" : "text-white/60"
                      )}>
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-2.5 items-end">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Waves className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100">
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                            style={{ animationDelay: `${i * 0.18}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick replies */}
                {showQuickReplies && messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_REPLIES.map(q => (
                      <button key={q} onClick={() => sendMessage(q)}
                        className="text-xs bg-white border border-primary/20 text-primary font-semibold px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors shadow-sm">
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary text-white disabled:opacity-30 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shrink-0 shadow-sm shadow-primary/20"
                >
                  {isLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        {open
          ? <X className="h-6 w-6" />
          : <MessageCircle className="h-6 w-6" />
        }
        {/* Unread badge */}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
