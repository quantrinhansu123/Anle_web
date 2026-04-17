import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Clock, Ship, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import {
  notificationService,
  type Notification,
  type NotificationSeverity,
} from '../services/notificationService';

const POLL_INTERVAL = 60000; // 60 seconds

const SEVERITY_CONFIG: Record<NotificationSeverity, { bg: string; icon: React.ReactNode; dot: string }> = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: <Ship size={14} className="text-blue-500" />,
    dot: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: <Clock size={14} className="text-amber-600" />,
    dot: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-50 border-red-200',
    icon: <AlertTriangle size={14} className="text-red-500" />,
    dot: 'bg-red-500',
  },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  delay_alert: <Clock size={14} className="text-amber-600" />,
  incident: <AlertTriangle size={14} className="text-red-500" />,
  sla_breach: <Zap size={14} className="text-red-600" />,
  cost_overrun: <AlertTriangle size={14} className="text-orange-500" />,
  status_change: <Ship size={14} className="text-blue-500" />,
  system: <Bell size={14} className="text-slate-500" />,
};

const formatTimeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(d);
};

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount();
      setUnreadCount(result?.count ?? 0);
    } catch (err) {
      // Silent fail for polling
    }
  };

  const fetchNotifications = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentCursor = loadMore && notifications.length > 0 
        ? notifications[notifications.length - 1].created_at 
        : undefined;

      const data = await notificationService.getNotifications(30, false, currentCursor);
      
      if (Array.isArray(data)) {
        if (loadMore) {
          setNotifications(prev => [...prev, ...data]);
        } else {
          setNotifications(data);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + polling for count (pauses when tab inactive)
  useEffect(() => {
    fetchUnreadCount();

    const doPoll = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    pollRef.current = setInterval(doPoll, POLL_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch full list when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative p-2 rounded-xl transition-all',
          isOpen
            ? 'bg-primary/10 text-primary'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black animate-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-black text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/10 transition-all"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[11px] text-slate-400 mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="mx-auto text-slate-200 mb-2" />
                <p className="text-[13px] text-slate-400 font-medium">No notifications</p>
                <p className="text-[11px] text-slate-300 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => {
                  const sevConfig = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.info;
                  const icon = TYPE_ICON[n.type] || TYPE_ICON.system;

                  return (
                    <div
                      key={n.id}
                      className={clsx(
                        'px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-pointer group',
                        !n.is_read && 'bg-blue-50/30'
                      )}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5',
                          sevConfig.bg,
                        )}>
                          {icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!n.is_read && (
                              <span className={clsx('w-2 h-2 rounded-full shrink-0', sevConfig.dot)} />
                            )}
                            <p className={clsx(
                              'text-[12px] truncate',
                              n.is_read ? 'font-medium text-slate-500' : 'font-bold text-slate-800'
                            )}>
                              {n.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-300 mt-1 tabular-nums">
                            {formatTimeAgo(n.created_at)}
                          </p>
                        </div>

                        {/* Mark as read */}
                        {!n.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(n.id);
                            }}
                            className="p-1 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {notifications.length > 0 && notifications.length % 30 === 0 && (
                  <button
                    onClick={() => fetchNotifications(true)}
                    disabled={loading}
                    className="w-full py-3 text-center text-[12px] font-bold text-primary hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load older notifications'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
