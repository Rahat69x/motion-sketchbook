"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  FileText,
  CheckCircle2,
  MessageSquare,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  PlusCircle,
  Play,
  FileCheck,
} from "lucide-react";
import { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; targetRole: string; university: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        setStats(data.stats);
        setUserProfile(data.user);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar userName={userProfile?.name} userRole={userProfile?.targetRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Placement Drive 2026 Readiness</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-amber-400">{userProfile?.name || "Student"}</span>!
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Targeting: <strong className="text-white">{userProfile?.targetRole || "Software Engineer"}</strong> | {userProfile?.university || "University"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Your placement preparation command center: craft ATS-optimized resumes, simulate behavioral and technical interviews, and master aptitude speed tests.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/resumes"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-orange-400 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Resume</span>
              </a>
              <a
                href="/aptitude"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              >
                <Play className="h-4 w-4 text-amber-400" />
                <span>Take Quick Aptitude Quiz</span>
              </a>
            </div>
          </div>
        </div>

        {/* Real Dynamic Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Resumes Created</span>
              <FileText className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loading ? "..." : stats?.totalResumes ?? 0}
              </span>
              <span className="text-[11px] text-slate-400">active drafts</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>ATS Job Scans</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loading ? "..." : stats?.atsChecksCount ?? 0}
              </span>
              <span className="text-[11px] text-emerald-400">verified</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Mock Interviews</span>
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loading ? "..." : stats?.interviewSessionsCount ?? 0}
              </span>
              <span className="text-[11px] text-indigo-400">
                {stats?.interviewAvgScore ? `Avg: ${stats.interviewAvgScore}%` : "No sessions yet"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Aptitude Accuracy</span>
              <BrainCircuit className="h-4 w-4 text-orange-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {loading ? "..." : stats?.aptitudeAccuracy ? `${stats.aptitudeAccuracy}%` : "0%"}
              </span>
              <span className="text-[11px] text-slate-400">
                {stats?.aptitudeTestsCount ? `${stats.aptitudeTestsCount} tests taken` : "Take first test"}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Core Placement Tools Grid */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span>Core Placement Preparation Suite</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tool 1: Resume Builder */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm transition hover:border-amber-500/50 hover:bg-slate-900/80 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  Multiple Templates
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-amber-400 transition">
                Interactive Resume Builder
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Build recruiter-ready, single/two-column resumes with live previews, action-verb suggestions for students with zero experience, and direct PDF print export.
              </p>
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">
                  {stats?.totalResumes ? `${stats.totalResumes} resumes in database` : "No resumes created yet"}
                </span>
                <a
                  href="/resumes"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
                >
                  <span>Open Builder</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Tool 2: ATS Checker */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm transition hover:border-emerald-500/50 hover:bg-slate-900/80 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  Explainable Match
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-emerald-400 transition">
                ATS Compatibility Checker
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Match your resume directly against target job descriptions. Uncover missing technical keywords, formatting risks, and actionable recommendations to pass employer filters.
              </p>
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">Target Role Scanner</span>
                <a
                  href="/ats-checker"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  <span>Scan Resume</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Tool 3: Mock Interview */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm transition hover:border-indigo-500/50 hover:bg-slate-900/80 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  STAR Framework
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-indigo-400 transition">
                Interactive Mock Interview
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Practice HR, behavioral, technical, and system design interviews under real time constraints. Receive instant scoring and constructive critiques on structure and clarity.
              </p>
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">Behavioral & Technical</span>
                <a
                  href="/mock-interview"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <span>Start Session</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Tool 4: Aptitude Practice */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm transition hover:border-orange-500/50 hover:bg-slate-900/80 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-110 transition">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  Speed Tests & Solutions
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-orange-400 transition">
                Aptitude Practice & Tests
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Ace on-campus round-1 filtering exams with practice sets in Quantitative Math, Logical Reasoning, Verbal Ability, and Data Interpretation with step-by-step solutions.
              </p>
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-500">40+ Curated Problems</span>
                <a
                  href="/aptitude"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Recent Preparation Activity</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading your preparation timeline...</div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 transition hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                      {item.type === "resume" && <FileText className="h-3.5 w-3.5" />}
                      {item.type === "ats" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {item.type === "interview" && <MessageSquare className="h-3.5 w-3.5" />}
                      {item.type === "aptitude" && <BrainCircuit className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-0 flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <a
                      href={item.link}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No recent activity found. Start by creating a resume or practicing aptitude questions!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
