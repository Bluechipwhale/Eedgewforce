import React, { useEffect, useState } from 'react';
import { Bot, Send, Sparkles, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

const prompts = ['What needs attention today?', 'Are any client deliverables overdue?', 'Summarize team workload', 'What data is missing?'];

export default function OperationalInsightsDrawer({ isOpen, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true); setError('');
    try { setSnapshot(await api.get('/ai/insights', { fresh: true })); }
    catch (err) { setError(err.message || 'Could not load the company briefing.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (isOpen) refresh(); }, [isOpen]);

  const ask = async question => {
    const prompt = (question || input).trim();
    if (!prompt || loading) return;
    setMessages(current => [...current, { role: 'user', text: prompt }]);
    setInput(''); setLoading(true); setError('');
    try {
      const result = await api.post('/ai/copilot', { prompt });
      const answer = result.guidance || result.data?.guidance;
      setMessages(current => [...current, { role: 'assistant', text: answer || 'No answer was returned.' }]);
      setSnapshot(result.data || snapshot);
    } catch (err) { setError(err.message || 'The briefing could not be generated.'); }
    finally { setLoading(false); }
  };
  if (!isOpen) return null;
  const metrics = snapshot?.metrics || {};
  const cards = [
    ['Overdue tasks', metrics.tasks?.overdue], ['Due in 24 hours', metrics.tasks?.due_next_24h],
    ['Open leave requests', metrics.leave?.pending], ['Stock alerts', metrics.inventory ? metrics.inventory.out_of_stock + metrics.inventory.below_reorder : null],
    ['Failed reminders', metrics.reminders?.failed_or_unconfigured], ['Open safety alerts', metrics.safety?.active]
  ].filter(([, value]) => value !== undefined && value !== null);
  return <div className="fixed inset-0 z-[70] overflow-hidden" role="dialog" aria-modal="true" aria-label="Operational AI briefing">
    <button type="button" aria-label="Close briefing" onClick={onClose} className="absolute inset-0 bg-black/50" />
    <section className="absolute inset-y-0 right-0 w-full max-w-xl surface-card border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
      <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Sparkles className="text-orange-500" size={18} /><div>
          <h2 className="text-sm font-bold">Operational AI</h2>
          <p className="text-xs text-zinc-500">{snapshot ? `${snapshot.role} · ${snapshot.scope} view` : 'Company performance and priorities'}</p>
        </div></div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={refresh} disabled={loading} title="Refresh briefing" className="p-2 text-zinc-500 hover:text-orange-500 disabled:opacity-50"><RefreshCw size={16} /></button>
          <button type="button" onClick={onClose} title="Close" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={18} /></button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {error && <div role="alert" className="flex gap-2 text-xs text-rose-600"><AlertTriangle size={15} />{error}</div>}
        {snapshot && <p className={`text-[11px] ${snapshot.ai_mode === 'openai' ? 'text-emerald-600' : 'text-amber-700 dark:text-amber-400'}`}>
          {snapshot.ai_mode === 'openai' ? 'AI analysis connected' : 'Calculated live insights · AI model not configured'}
        </p>}
        {cards.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          {cards.map(([label, value]) => <div key={label}><div className="text-xl font-bold tabular-nums">{value}</div><div className="text-[11px] text-zinc-500">{label}</div></div>)}
        </div>}
        {snapshot?.findings?.map(item => <article key={`${item.topic}-${item.title}`} className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-start justify-between gap-2"><h3 className="text-xs font-bold">{item.title}</h3><span className={`text-[10px] uppercase ${item.severity === 'high' ? 'text-rose-600' : item.severity === 'attention' ? 'text-amber-600' : 'text-emerald-600'}`}>{item.severity}</span></div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{item.detail}</p>
          <p className="text-xs mt-1">{item.action}</p>
          {item.records?.map(record => <p key={record.id} className="text-[11px] text-zinc-500 mt-1">{record.title || record.name} · {record.due_at ? new Date(record.due_at).toLocaleString() : `Record ${record.id}`}</p>)}
        </article>)}
        {snapshot?.sources?.some(s => s.status === 'unavailable') && <p className="text-[11px] text-amber-700 dark:text-amber-400">Some data sources could not be read. Their totals are excluded, not counted as zero.</p>}
        {messages.map((message, index) => <div key={index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
          {message.role === 'assistant' && <Bot size={16} className="mt-2 shrink-0 text-orange-500" />}
          <pre className={`whitespace-pre-wrap break-words text-xs leading-relaxed p-3 rounded-lg max-w-[88%] font-sans ${message.role === 'user' ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>{message.text}</pre>
        </div>)}
        {loading && <p role="status" className="text-xs text-zinc-500">Checking current records…</p>}
        {!snapshot && !loading && !error && <p className="text-xs text-zinc-500">No briefing data available.</p>}
      </div>
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex gap-2"><input aria-label="Ask operational AI" className="form-input text-xs min-w-0" placeholder="Ask about tasks, sales, stock, or attendance..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} />
          <button title="Send question" onClick={() => ask()} disabled={!input.trim() || loading} className="btn-primary px-3 disabled:opacity-50"><Send size={15} /></button></div>
        <div className="flex gap-2 overflow-x-auto">{prompts.map(prompt => <button key={prompt} onClick={() => ask(prompt)} disabled={loading} className="shrink-0 text-[10px] px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded-md hover:border-orange-500 disabled:opacity-50">{prompt}</button>)}</div>
        {snapshot && <p className="text-[10px] text-zinc-500">Updated {new Date(snapshot.generated_at).toLocaleTimeString()} · {snapshot.data_mode} data</p>}
      </div>
    </section>
  </div>;
}
