// ==============================================================================
// EDGEWFORCE - TASK INTELLIGENCE CREATION MODAL
// Multi-channel reminders, client deliverable tags, priority, & due timestamps.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Send,
  Building2,
  Calendar,
  Clock,
  Bell,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../lib/api';
import StaffPicker from './StaffPicker';

export function TaskCreateModal({ isOpen, onClose, onCreated }) {
  const [employees, setEmployees] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffAttempt, setStaffAttempt] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    client_name: '',
    project_name: '',
    priority: 'normal',
    task_type: 'general',
    due_date: new Date().toISOString().slice(0, 10),
    due_time: '16:00',
    reminders: [15, 0, -15],
    channels: ['in_app', 'email', 'whatsapp', 'push']
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (isOpen) {
      setStaffLoading(true);
      setStaffError('');
      const fetchEmps = async () => {
        try {
          const res = await api.get('/tasks/assignable-employees', { fresh: true });
          const list = Array.isArray(res) ? res : (res?.employees || res?.data || []);
          if (!cancelled) setEmployees(list);
        } catch (err) {
          if (!cancelled) { setEmployees([]); setStaffError(err.message || 'Unable to load staff.'); }
        } finally {
          if (!cancelled) setStaffLoading(false);
        }
      };
      fetchEmps();
    }
    return () => { cancelled = true; };
  }, [isOpen, staffAttempt]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assigned_to) {
      setErrorMsg('Task title and assigned staff member are required.');
      return;
    }
    if (!employees.some(e => String(e.id) === String(formData.assigned_to) && e.assignable !== false)) {
      setErrorMsg('Choose an available staff member from the current directory.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}:00`).toISOString();

      await api.post('/tasks', {
        ...formData,
        due_at: dueDateTime
      });

      onCreated?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (ch) => {
    const active = formData.channels.includes(ch);
    setFormData({
      ...formData,
      channels: active ? formData.channels.filter(c => c !== ch) : [...formData.channels, ch]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="surface-card rounded-2xl p-6 w-full max-w-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50">
              Assign Directive & Schedule Multi-Channel Reminders
            </h3>
            <p className="text-xs text-zinc-500">
              Configure deliverable checkpoints, deadlines, and automated WhatsApp/Email alerts
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Directive / Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Submit Carex Q3 Merchandising Performance Deck"
              className="form-input text-xs"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* Assigned Staff */}
            <StaffPicker employees={employees} value={formData.assigned_to}
              onChange={assigned_to => setFormData({ ...formData, assigned_to })}
              loading={staffLoading} error={staffError} onRetry={() => setStaffAttempt(n => n + 1)} />

            {/* Task Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Directive Type
              </label>
              <select
                className="form-input text-xs"
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
              >
                <option value="general">Internal Operational Task</option>
                <option value="delivery">Client Deliverable (Forgot-To-Send Protection)</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {/* Client Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Client / Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. Carex, PZ Cussons, Nigerian Breweries"
                className="form-input text-xs"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Project / Campaign
              </label>
              <input
                type="text"
                placeholder="e.g. BBNaija Tour, Modern Trade Q3"
                className="form-input text-xs"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Priority Level
              </label>
              <select
                className="form-input text-xs"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent Escalation</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Deadline Date
              </label>
              <input
                type="date"
                className="form-input text-xs"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            {/* Due Time */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Deadline Time
              </label>
              <input
                type="time"
                className="form-input text-xs"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Instructions & Deliverable Guidelines
            </label>
            <textarea
              rows={3}
              placeholder="Detail required deck sections, client email address, proof criteria..."
              className="form-input text-xs"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Multi-Channel Reminders Channels Toggle */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <label className="block text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
              Active Reminder Channels (Multi-Stage Alerts at -15m, 0m, +15m)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => toggleChannel('in_app')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${formData.channels.includes('in_app') ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
              >
                <Bell size={13} />
                <span>In-App</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChannel('email')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${formData.channels.includes('email') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
              >
                <Mail size={13} />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChannel('whatsapp')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${formData.channels.includes('whatsapp') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
              >
                <Smartphone size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChannel('push')}
                className={`p-2 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition ${formData.channels.includes('push') ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
              >
                <Bell size={13} />
                <span>Push</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || staffLoading || !!staffError || !formData.assigned_to}
              className="btn-primary text-xs py-2 px-4 bg-orange-500 text-white font-bold flex items-center gap-1.5"
            >
              <Send size={14} />
              <span>{loading ? 'Scheduling Directive…' : 'Schedule Task & Reminders'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
