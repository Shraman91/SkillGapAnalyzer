"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, LogOut, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-6 py-4 flex justify-between items-center transition-colors">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
            Sg
          </div>
          <h1 className="font-semibold text-lg tracking-tight text-gray-900 dark:text-white">
            AI Skill Gap Analyzer
          </h1>
        </Link>
      </div>

      <nav className="hidden md:flex gap-6 text-sm font-medium">
        <Link href="/dashboard" className="text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition">
          Dashboard
        </Link>
        <Link href="/analyze" className="text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition">
          New Analysis
        </Link>
        <Link href="/roles" className="text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition">
          Roles
        </Link>
        <Link href="/jobs" className="text-violet-700 dark:text-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition">
          Job Market
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl">
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user.displayName || user.email?.split("@")[0] || "Student"}</span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-xs font-semibold bg-blue-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
