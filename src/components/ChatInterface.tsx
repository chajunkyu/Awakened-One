"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, WorldState } from "@/lib/types";

interface Props {
  messages: ChatMessage[];
  worldState: WorldState;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInterface({
  messages,
  worldState,
  onSend,
  disabled,
}: Props) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // NPC 타이핑 애니메이션
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "player") {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  const stateColors: Record<WorldState, string> = {
    calm: "border-blue-500/20 focus:border-blue-400/40",
    ripple: "border-indigo-500/20 focus:border-indigo-400/40",
    tension: "border-purple-500/20 focus:border-purple-400/40",
    conflict: "border-orange-500/20 focus:border-orange-400/40",
    critical: "border-red-500/30 focus:border-red-400/50",
    collapse: "border-white/50",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className="animate-msg-in">
            {/* World effect description */}
            {msg.worldEffect && (
              <p className="text-center text-xs text-white/20 italic mb-4 tracking-wider">
                {msg.worldEffect}
              </p>
            )}

            {msg.role === "player" ? (
              // Player message
              <div className="flex justify-end">
                <div className="max-w-[75%] bg-white/5 border border-white/10 rounded-2xl rounded-br-sm px-4 py-3">
                  <p className="text-white/80 text-sm">{msg.text}</p>
                </div>
              </div>
            ) : (
              // Awakened One message
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <p className="text-xs text-amber-400/40 mb-1 tracking-widest">
                    깨어난 자
                  </p>
                  <div
                    className={`rounded-2xl rounded-bl-sm px-5 py-4 ${
                      worldState === "critical"
                        ? "bg-red-950/30 border border-red-500/20"
                        : worldState === "conflict"
                        ? "bg-purple-950/20 border border-purple-500/10"
                        : "bg-white/[0.02] border border-white/5"
                    }`}
                  >
                    <div className="text-white/85 text-sm leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>
                    {/* Sage influence indicator (subtle) */}
                    {msg.sageInfluence && msg.sageInfluence.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {msg.sageInfluence.includes("sage1") && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" title="절대자 관점" />
                        )}
                        {msg.sageInfluence.includes("sage2") && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" title="의미 관점" />
                        )}
                        {msg.sageInfluence.includes("sage3") && (
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400/40" title="해체 관점" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-msg-in">
            <div className="max-w-[85%]">
              <p className="text-xs text-amber-400/40 mb-1 tracking-widest">
                깨어난 자
              </p>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl rounded-bl-sm px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/5 bg-black/20 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "..." : "질문을 입력하세요..."}
            disabled={disabled}
            className={`flex-1 bg-transparent border ${stateColors[worldState]} rounded-full px-5 py-3 text-sm text-white/90 placeholder:text-white/20 outline-none transition-all duration-500 disabled:opacity-30`}
            autoFocus
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="px-5 py-3 rounded-full text-sm text-white/60 hover:text-white/90 border border-white/10 hover:border-white/30 transition-all disabled:opacity-20 disabled:hover:border-white/10"
          >
            물어보기
          </button>
        </form>
      </div>
    </div>
  );
}
