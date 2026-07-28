"use client";

import { useState, useEffect } from "react";
import { Search, Moon, Sun, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export default function Topbar({ title, actions, onMenuClick }: TopbarProps) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleDark = () => {
    setDark((prev) => !prev);
  };

  return (
    <header className="min-h-14 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end max-w-full">
        {/* <div className="relative hidden md:flex items-center">
          <Search
            size={14}
            className="absolute left-2.5 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search admissions, employees…"
            className={cn(
              "pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700",
              "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-600 w-44 lg:w-56",
            )}
          />
        </div> */}

        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="relative hidden sm:block">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          />

          {notifOpen && (
            <div className="absolute right-0 top-10 w-[min(20rem,calc(100vw-2rem))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Notifications
                </p>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {actions ? (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
