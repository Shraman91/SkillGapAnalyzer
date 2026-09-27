"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  LayoutDashboard,
  Search,
  Target,
  Briefcase,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "New Analysis", href: "/analyze", icon: Search },
    { name: "Roles", href: "/roles", icon: Target },
    { name: "Job Market", href: "/jobs", icon: Briefcase },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-blue-100 bg-white dark:border-purple-900/60 dark:bg-black">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-5 dark:border-purple-900/60">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm dark:bg-purple-600">
          SG
        </div>

        <div>
          <h1 className="font-bold text-slate-900 dark:text-white">
            Skill Gap
          </h1>
          <p className="text-xs text-slate-500 dark:text-purple-300">
            AI Analyzer
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-purple-400">
          Menu
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-purple-950/60 dark:text-purple-300"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-3 border-t border-blue-100 p-4 dark:border-purple-900/60">
        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-blue-600" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* User */}
        {user ? (
          <div className="rounded-xl bg-blue-50 p-3 dark:bg-purple-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-purple-600">
                <UserIcon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                  {user.displayName ||
                    user.email?.split("@")[0] ||
                    "Student"}
                </p>
                <p className="text-xs text-slate-500 dark:text-purple-300">
                  Account
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-purple-950/40"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              <Sparkles className="h-4 w-4" />
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}