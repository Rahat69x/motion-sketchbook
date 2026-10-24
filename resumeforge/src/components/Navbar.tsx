"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  MessageSquare,
  BrainCircuit,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Flame,
} from "lucide-react";

interface NavbarProps {
  userName?: string;
  userRole?: string;
}

export default function Navbar({ userName, userRole }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Resume Builder", href: "/resumes", icon: FileText },
    { label: "ATS Checker", href: "/ats-checker", icon: CheckCircle2 },
    { label: "Mock Interview", href: "/mock-interview", icon: MessageSquare },
    { label: "Aptitude Practice", href: "/aptitude", icon: BrainCircuit },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <a href="/dashboard" className="flex items-center gap-2.5 text-white transition hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-md shadow-orange-500/20">
            <Flame className="h-5 w-5 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">
              Resume<span className="text-amber-400">Forge</span>
            </span>
            <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase -mt-1">
              Placement Preparation
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-800/80 text-amber-400 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User profile & actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/settings"
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-700 hover:text-white"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-amber-400">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-200 leading-tight">{userName || "Alex Rivera"}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{userRole || "Student"}</p>
            </div>
          </a>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out of ResumeForge"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:bg-red-950/40 hover:border-red-900 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? "bg-slate-800 text-amber-400" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span>{link.label}</span>
                </a>
              );
            })}

            <div className="pt-2 border-t border-slate-800/80 mt-2">
              <a
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Account Settings ({userName || "Student"})</span>
              </a>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
