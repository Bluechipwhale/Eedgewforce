import React, { useId, useMemo, useState } from 'react';
import { Search, RefreshCw, Check } from 'lucide-react';

export default function StaffPicker({ employees, value, onChange, loading, error, onRetry }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(true);
  const selected = employees.find(e => String(e.id) === String(value));
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/);
    return employees.filter(e => {
      const text = [e.full_name, e.first_name, e.last_name, e.employee_code, e.department, e.position].join(' ').toLowerCase();
      return words.every(word => text.includes(word));
    });
  }, [employees, query]);
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">Assigned Staff Member *</label>
    {selected && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}
      className="text-xs text-left text-emerald-700 dark:text-emerald-400 flex items-center gap-1 break-words">
      <Check size={14} className="shrink-0" />{selected.full_name || `${selected.first_name} ${selected.last_name}`}
    </button>}
    {expanded && <>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
        <input id={id} type="search" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search staff..." className="form-input text-xs pl-9" autoComplete="off" aria-controls={`${id}-results`} />
      </div>
      {loading ? <p role="status" className="text-xs text-zinc-500">Loading staff...</p> : error ?
        <div role="alert" className="text-xs text-rose-600 space-y-1"><p>{error}</p>
          <button type="button" onClick={onRetry} className="flex items-center gap-1"><RefreshCw size={13} />Retry</button>
        </div> : <>
          <p role="status" className="text-xs text-zinc-500">{matches.length} of {employees.length} staff</p>
          <div id={`${id}-results`} className="max-h-48 overflow-y-auto overscroll-contain border border-zinc-200 dark:border-zinc-700 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
            {matches.length === 0 && <p className="p-3 text-xs text-zinc-500">{employees.length ? 'No matching staff.' : 'No staff records available.'}</p>}
            {matches.map(e => <label key={e.id} className={`flex items-start gap-2 p-2 text-xs break-words ${e.assignable === false ? 'opacity-50' : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <input type="radio" name={id} value={e.id} checked={String(value) === String(e.id)} disabled={e.assignable === false}
                onChange={() => { onChange(String(e.id)); setExpanded(false); }} className="mt-1 shrink-0" />
              <span className="min-w-0"><span className="block font-semibold">{e.full_name || `${e.first_name} ${e.last_name}`}</span>
                <span className="block text-zinc-500">{[e.employee_code, e.department, e.position].filter(Boolean).join(' / ')}</span>
                {e.assignable === false && <span className="block text-zinc-500">Unavailable for assignment</span>}
              </span>
            </label>)}
          </div>
        </>}
    </>}
  </div>;
}
