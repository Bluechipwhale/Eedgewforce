import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  LogOut,
  Menu,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Shield,
  Layers,
  Search,
  Building2,
  Sparkles
} from 'lucide-react';
import { toggleAudioMute, isAudioMuted } from '../../lib/sound';

export default function TopHeader({
  user,
  dark,
  onToggleTheme,
  online,
  queuedCount = 0,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenCommandPalette,
  onManualSync,
  syncing = false,
  onLogout,
  onToggleMobileMenu,
  onOpenInsights
}) {
  const [muted, setMuted] = useState(isAudioMuted());
  const [profileOpen, setProfileOpen] = useState(false);

  const handleMuteToggle = () => {
    const newState = toggleAudioMute();
    setMuted(newState);
  };

  return (
    <header className="sticky top-0 z-40 topbar-surface backdrop-blur-md px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs border-b border-zinc-200 dark:border-zinc-800">
      {/* Left Branding & Company Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 block">
                EdgeWForce
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">
              Operating System for Field Sales & Operations
            </span>
          </div>
        </div>
      </div>

      {/* Center Search Bar Trigger (Ctrl + K) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-400 transition"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-zinc-400" />
            <span>Search agents, customers, orders, inventory...</span>
          </div>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-500">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={onOpenInsights} title="Open operational AI" aria-label="Open operational AI"
          className="p-2 text-orange-600 hover:bg-orange-500/10 rounded-lg"><Sparkles size={17} /></button>
        {/* Offline / Online Pill */}
        <div className="flex items-center gap-1.5">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            online
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 animate-pulse'
          }`}>
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden sm:inline">{online ? 'Live Telemetry' : `Offline (${queuedCount})`}</span>
          </div>

          {online && queuedCount > 0 && (
            <button
              onClick={onManualSync}
              disabled={syncing}
              title="Sync queued offline actions"
              className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-1 transition"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sync ({queuedCount})</span>
            </button>
          )}
        </div>

        {/* Audio Mute / Sound Toggle */}
        <button
          onClick={handleMuteToggle}
          title={muted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}

          className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          {muted ? <VolumeX size={17} className="text-zinc-400" /> : <Volume2 size={17} className="text-orange-500" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <Bell size={17} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-zinc-900 animate-pulse" />
          )}
        </button>

        {/* User Pill / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shadow-xs">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {user.full_name}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                {user.rank?.name || user.role_code?.replace('_', ' ').toLowerCase()}
              </div>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 surface-card rounded-xl shadow-xl p-2 border border-zinc-200 dark:border-zinc-800 z-50 animate-fade-in">
              <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 mb-1">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{user.full_name}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</div>
                <div className="mt-1.5 flex gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    {user.role_code}
                  </span>
                  {user.rank?.code && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {user.rank.code}
                    </span>
                  )}
                </div>
              </div>


              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition mt-1"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
