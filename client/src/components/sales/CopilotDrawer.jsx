import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, Lightbulb, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function CopilotDrawer({ isOpen, onClose, selectedCustomer, currentCart = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I can summarize the sales and operations records available to your account, explain risks, and suggest next steps. Ask about a customer, balance, order, stock, or task.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Customer says price is too high',
    'How do I collect overdue balance?',
    'Recommend cross-sell bundles',
    'Competitor offers 5% cheaper'
  ];

  const handleSend = async (textToSend = null) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/copilot', {
        prompt: text,
        customer_id: selectedCustomer?.id || null,
        cart: currentCart
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.guidance || res.data?.guidance || 'I have analyzed your commercial scenario. Let me know if you need further tactical assistance.'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error retrieving guidance: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg surface-card border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-amber-500/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-500 text-white shadow-xs">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  Operational AI
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Insights grounded in your permitted company data'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-2 overflow-x-auto">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold surface-card border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 text-zinc-700 dark:text-zinc-300 whitespace-nowrap transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-1">
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-orange-500 text-white font-medium rounded-br-none'
                      : 'surface-card-subtle text-zinc-800 dark:text-zinc-200 rounded-bl-none border border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-zinc-700 text-white flex items-center justify-center text-xs flex-shrink-0 mt-1">
                    <User size={13} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-center text-xs text-orange-500 font-semibold p-2 animate-pulse">
                <Sparkles size={14} />
                <span>Copilot is formulating commercial guidance…</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask Copilot (e.g. Customer says competitor is cheaper)..."
              className="form-input text-xs"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn-primary px-3.5"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
