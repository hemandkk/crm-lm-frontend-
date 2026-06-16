"use client";

import { useState } from "react";
import { Search, Bell, Moon, Sun, X, Check } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks";
import { Button, Spinner } from "@/components/ui";

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, actions }: TopbarProps) {
  const [dark, setDark] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: notifications, isLoading: notifsLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
      <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Global search */}
        <div className="relative hidden md:flex items-center">
          <Search
            size={14}
            className="absolute left-2.5 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search leads, employees…"
            className={cn(
              "pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-600 w-56"
            )}
          />
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-danger-600 text-white text-[9px] font-bold rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Notifications
                </p>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAll.mutate()}
                      isLoading={markAll.isPending}
                      leftIcon={<Check size={12} />}
                    >
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {notifsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size={18} />
                  </div>
                ) : !notifications?.length ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer",
                        !n.read && "bg-primary-50/50 dark:bg-primary-900/10"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                        )}
                        <div className={cn(!n.read ? "" : "pl-3.5")}>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Page-specific actions */}
        {actions}
      </div>
    </header>
  );
}
