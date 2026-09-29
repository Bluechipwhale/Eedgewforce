// ==============================================================================
// EDGEWFORCE - TODAY'S TASK INTELLIGENCE & REMINDER COMMAND CENTER
// Live Countdown Telemetry, 4-Stage Client Delivery Protection,
// Multi-Channel Status Badges, and Evidence Attachment Completion.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  FileCheck,
  Bell,
  Mail,
  Smartphone,
  Check,
  ChevronRight,
  Eye,
  Plus,
  Radio,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Search
} from 'lucide-react';
import { api } from '../../lib/api';

function TaskDiscussion({ taskId }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const load = async () => {
    try { const result = await api.get(`/tasks/${taskId}/discussion`, { fresh: true }); setComments(Array.isArray(result) ? result : result?.data || []); setError(''); }
    catch (err) { setError(err.message || 'Discussion unavailable.'); }
  };
  useEffect(() => {
    if (!open) return undefined;
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [open, taskId]);
  const toggle = () => { const next = !open; setOpen(next); if (next) load(); };
  const send = async e => {
    e.preventDefault(); if (!draft.trim() || sending) return;
    setSending(true); setError('');
    try { await api.post(`/tasks/${taskId}/discussion`, { comment: draft }); setDraft(''); await load(); }
    catch (err) { setError(err.message || 'Could not add update.'); }
    finally { setSending(false); }
  };
  return <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
    <button type="button" aria-expanded={open} onClick={toggle} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-orange-500">
      <MessageSquare size={14} /> Team discussion{comments.length ? ` (${comments.length})` : ''}
    </button>
    {open && <div className="mt-2 space-y-2">
      <div className="max-h-40 overflow-y-auto space-y-2" aria-live="polite">
        {comments.map(comment => <article key={comment.id} className="text-xs border-l-2 border-orange-400 pl-2">
          <div className="flex flex-wrap gap-x-2 text-zinc-500"><b className="text-zinc-800 dark:text-zinc-200">{comment.author}</b><time>{comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</time></div>
          <p className="mt-0.5 whitespace-pre-wrap break-words">{comment.comment}</p>
        </article>)}
        {!comments.length && !error && <p className="text-xs text-zinc-500">No updates yet.</p>}
      </div>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      <form onSubmit={send} className="flex gap-2"><input aria-label="Write a task update" maxLength={2000} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Share a progress update or ask a question..." className="form-input min-w-0 text-xs" />
        <button disabled={!draft.trim() || sending} className="btn-secondary px-3 text-xs disabled:opacity-50">{sending ? 'Posting…' : 'Post'}</button></form>
    </div>}
  </div>;
}

export function TodayTaskCenter({ onOpenCreateModal, currentEmployeeId, isSupervisor = false }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'urgent', 'delivery', 'completed'
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [stages, setStages] = useState({
    prepared: false,
    reviewed: false,
    sent_to_client: false,
    client_delivery: false
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks', { fresh: true });
      const list = Array.isArray(res) ? res : (res?.tasks || res?.data || []);
      setTasks(list);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Could not load team tasks. Check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 20000); // Live sync
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/acknowledge`);
      setSuccessMsg('Acknowledged task. Reminders will notify you before the deadline.');
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const openCompleteModal = (task) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setEvidenceName('');
    setStages(task.delivery_stages || {
      prepared: true,
      reviewed: true,
      sent_to_client: false,
      client_delivery: false
    });
    setErrorMsg('');
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async (e) => {
    e?.preventDefault();
    if (!selectedTask) return;

    if (selectedTask.task_type === 'delivery' && !stages.sent_to_client) {
      setErrorMsg('⚠️ Delivery Protection: You must verify that the deliverable was sent to the client (sent_to_client) before marking as completed.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg('');
      await api.post(`/tasks/${selectedTask.id}/complete`, {
        completion_notes: completionNotes || 'Deliverable finalized and sent to client.',
        evidence_name: evidenceName || 'Client Confirmation / Deck',
        delivery_stages: stages
      });
      setSuccessMsg(`Task "${selectedTask.title}" marked as complete! Proactive reminders cancelled.`);
      setCompleteModalOpen(false);
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const completed = ['completed', 'cancelled', 'canceled'].includes(String(t.status).toLowerCase());
    if (filter === 'urgent' && (!['high', 'urgent'].includes(t.priority?.toLowerCase()) || completed)) return false;
    if (filter === 'delivery' && (t.task_type !== 'delivery' || completed)) return false;
    if (filter === 'completed' && !completed) return false;
    if (!['completed', 'urgent', 'delivery'].includes(filter) && completed) return false;
    const words = query.trim().toLowerCase().split(/\s+/);
    const haystack = [t.title, t.description, t.client_name, t.project_name, t.assigned_employee?.name, t.assigned_employee?.department].join(' ').toLowerCase();
    return words.every(word => haystack.includes(word));
  });

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="surface-card rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Today's Task & Deliverable Intelligence
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black uppercase">
                  Live Sync
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Company-wide task visibility • Shared team discussions • Deadline and delivery checkpoints
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-lg shadow-orange-500/20"
          >
            <Plus size={14} />
            <span>+ Assign Task</span>
          </button>
        </div>

        {/* Feedback banners */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
          >
            Active Tasks ({tasks.filter(t => !['completed', 'cancelled', 'canceled'].includes(String(t.status).toLowerCase())).length})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filter === 'urgent' ? 'bg-rose-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
          >
            <ShieldAlert size={13} />
            <span>Urgent & High Priority</span>
          </button>
          <button
            onClick={() => setFilter('delivery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filter === 'delivery' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
          >
            <Send size={13} />
            <span>Client Deliverables</span>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'}`}
          >
            Completed ({tasks.filter(t => ['completed', 'cancelled', 'canceled'].includes(String(t.status).toLowerCase())).length})
          </button>
        </div>

        <div className="relative max-w-lg"><Search size={14} className="absolute left-3 top-3 text-zinc-400" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks, colleagues, clients, projects..." className="form-input pl-9 text-xs" aria-label="Search team tasks" />
        </div>

        {/* Task List */}
        <div className="space-y-3 pt-2">
          {loading && tasks.length === 0 && <p role="status" className="p-6 text-center text-xs text-zinc-500">Loading team tasks…</p>}
          {!loading && errorMsg && tasks.length === 0 && <div role="alert" className="p-6 text-center text-xs text-zinc-500">{errorMsg}</div>}
          {!loading && !errorMsg && (filteredTasks.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 surface-card-subtle space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">All caught up!</p>
              <p className="text-[11px] text-zinc-400">No pending directives in this view.</p>
            </div>
          ) : (
            filteredTasks.map((tsk) => {
              const isOverdue = tsk.is_overdue;
              const isUrgent = ['urgent', 'high'].includes(tsk.priority?.toLowerCase());
              const isCompleted = ['completed', 'cancelled', 'canceled'].includes(String(tsk.status).toLowerCase());

              return (
                <div
                  key={tsk.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isOverdue
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : isUrgent
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 surface-card-subtle hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          tsk.priority === 'urgent' ? 'bg-rose-500 text-white' :
                          tsk.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {tsk.priority || 'Normal'}
                        </span>

                        {tsk.task_type === 'delivery' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                            <Send size={10} />
                            <span>Client Deliverable</span>
                          </span>
                        )}

                        {tsk.acknowledged_at && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <Check size={10} />
                            <span>Aware</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {tsk.title}
                      </h4>

                      {/* Client / Project Context */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {tsk.client_name && (
                          <span className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                            <Building2 size={13} className="text-orange-500" />
                            <span>{tsk.client_name}</span>
                          </span>
                        )}
                        {tsk.project_name && (
                          <span className="text-[11px]">
                            Project: <b>{tsk.project_name}</b>
                          </span>
                        )}
                        {tsk.assigned_employee && (
                          <span className="text-[11px]">
                            Assigned: <b>{tsk.assigned_employee.name}</b>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Countdown / Due Status */}
                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                        isOverdue
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        <Clock size={12} />
                        <span>{tsk.countdown_text || 'Due Soon'}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Due: {tsk.due_at ? new Date(tsk.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                    </div>
                  </div>

                  {tsk.description && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-black/5 dark:bg-white/5 p-2.5 rounded-lg">
                      {tsk.description}
                    </p>
                  )}

                  {/* 4-Stage Delivery Progress Bar (For Deliverables) */}
                  {tsk.task_type === 'delivery' && tsk.delivery_stages && (
                    <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        <span>4-Stage Delivery Checkpoints</span>
                        <span className="text-orange-500">
                          {Object.values(tsk.delivery_stages).filter(Boolean).length}/4 Complete
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                        <div className={`py-1 rounded ${tsk.delivery_stages.prepared ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                          1. Prepared
                        </div>
                        <div className={`py-1 rounded ${tsk.delivery_stages.reviewed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                          2. Reviewed
                        </div>
                        <div className={`py-1 rounded ${tsk.delivery_stages.sent_to_client ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                          3. Sent to Client
                        </div>
                        <div className={`py-1 rounded ${tsk.delivery_stages.client_delivery ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                          4. Delivered
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Channel Alerts Active Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="font-semibold">Reminders Active:</span>
                      <span className="flex items-center gap-1 text-orange-500" title="In-App">
                        <Bell size={12} /> App
                      </span>
                      <span className="flex items-center gap-1 text-emerald-500" title="WhatsApp Cloud API">
                        <Smartphone size={12} /> WhatsApp
                      </span>
                      <span className="flex items-center gap-1 text-blue-500" title="Hostinger SMTP">
                        <Mail size={12} /> Email
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {!tsk.acknowledged_at && !isCompleted && (
                        <button
                          onClick={() => handleAcknowledge(tsk.id)}
                          className="btn-secondary text-xs py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 hover:bg-zinc-200"
                        >
                          <Check size={13} />
                          <span>I'm Aware</span>
                        </button>
                      )}

                      {!isCompleted ? (
                        <button
                          onClick={() => openCompleteModal(tsk)}
                          className="btn-primary text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} />
                          <span>Complete Deliverable</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                  <TaskDiscussion taskId={tsk.id} />
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* MODAL: COMPLETE DELIVERABLE WITH FORGOT-TO-SEND PROTECTION */}
      {completeModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="surface-card rounded-2xl p-6 w-full max-w-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  Complete Deliverable & Verification
                </h3>
                <p className="text-xs text-zinc-500">
                  {selectedTask.title} • {selectedTask.client_name || 'Internal'}
                </p>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmComplete} className="space-y-4">
              {/* 4-Stage Checklist */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <label className="block text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                  Deliverable Stages Checklist *
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stages.prepared}
                      onChange={(e) => setStages({ ...stages, prepared: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>1. Deliverable / Report Prepared</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stages.reviewed}
                      onChange={(e) => setStages({ ...stages, reviewed: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>2. Internal Quality & Supervisor Review Completed</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 cursor-pointer bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                    <input
                      type="checkbox"
                      required={selectedTask.task_type === 'delivery'}
                      checked={stages.sent_to_client}
                      onChange={(e) => setStages({ ...stages, sent_to_client: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>3. SENT TO CLIENT (Crucial: Prevents forgotten delivery)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stages.client_delivery}
                      onChange={(e) => setStages({ ...stages, client_delivery: e.target.checked })}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>4. Final Client Delivery Acknowledged</span>
                  </label>
                </div>
              </div>

              {/* Evidence Attachment Reference */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Evidence / Attachment Reference (Document, Photo or Email Subject)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Carex_Q3_Deck_Final.pdf or Sent via client email at 2:30pm"
                  className="form-input text-xs"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Operational Completion Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes regarding deliverable transmission, client feedback, or special instructions..."
                  className="form-input text-xs"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{actionLoading ? 'Verifying…' : 'Sign Off & Complete Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
