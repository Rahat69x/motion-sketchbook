"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { InterviewSession, InterviewQuestion, InterviewAnswer } from "@/lib/types";
import { 
  BrainCircuit, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Play, 
  Target, 
  Award, 
  HelpCircle,
  Lightbulb,
  FileCheck,
  Zap,
  TrendingUp
} from "lucide-react";

export default function MockInterviewPage() {
  const router = useRouter();

  // Mode: 'setup' | 'interviewing' | 'results'
  const [stage, setStage] = useState<"setup" | "interviewing" | "results">("setup");
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);

  // Setup options
  const [category, setCategory] = useState<"hr" | "behavioral" | "technical" | "system-design">("behavioral");
  const [targetRole, setTargetRole] = useState("Software Engineering Intern");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [creating, setCreating] = useState(false);

  // Active interview state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (stage === "interviewing" && timerActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timerActive]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/interviews");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to load interview history:", err);
    }
  };

  const startNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          targetRole,
          difficulty,
          questionCount
        })
      });
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        setCurrentIndex(0);
        setAnswers({});
        setElapsedSeconds(0);
        setStage("interviewing");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!activeSession) return;
    setSubmitting(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        userAnswer: ans
      }));

      const res = await fetch(`/api/interviews/${activeSession.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          durationSeconds: elapsedSeconds
        })
      });
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        setStage("results");
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to submit interview answers:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BrainCircuit className="w-7 h-7 text-emerald-400" />
              <span>Interactive Mock Interview</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Practice placement interviews with STAR feedback for behavioral rounds and rubric scoring for technical questions.
            </p>
          </div>

          {stage !== "setup" && (
            <button
              onClick={() => {
                if (window.confirm("Return to interview setup? Current unsaved session progress will be closed.")) {
                  setStage("setup");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Practice Session</span>
            </button>
          )}
        </div>

        {/* ==============================================================
            STAGE 1: SETUP
           ============================================================== */}
        {stage === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Configuration Form */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={startNewSession} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-md">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Configure Your Interview Simulation</span>
                </h3>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Interview Round & Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "behavioral", label: "Behavioral (STAR)", desc: "Conflict, leadership, past experiences" },
                      { id: "hr", label: "HR & Culture Fit", desc: "Strengths, weaknesses, career aspirations" },
                      { id: "technical", label: "Technical / SDE", desc: "Data structures, OOP, web systems" },
                      { id: "system-design", label: "System Architecture", desc: "Scalability, caching, databases" }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          category === cat.id
                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-200 mb-1">{cat.label}</div>
                        <div className="text-[11px] text-slate-500 leading-tight">{cat.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Role */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Target Role or Domain
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineering Intern, Frontend Engineer, Data Analyst"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Difficulty & Question Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="easy">Entry / Internship (Easy)</option>
                      <option value="medium">Standard Campus Placement (Medium)</option>
                      <option value="hard">Advanced / FAANG Tier (Hard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Question Count
                    </label>
                    <select
                      value={questionCount}
                      onChange={e => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={3}>3 Questions (Quick ~10 mins)</option>
                      <option value={5}>5 Questions (Standard ~20 mins)</option>
                    </select>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{creating ? "Setting up questions..." : "Start Interview Practice"}</span>
                </button>
              </form>
            </div>

            {/* Right: History & Tips */}
            <div className="lg:col-span-5 space-y-6">
              {/* STAR Method Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>The STAR Method Guide</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  For behavioral questions, top recruiters grade answers on the <strong>STAR</strong> structure:
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <strong className="text-emerald-400">S — Situation:</strong> Describe the specific context and challenge.
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <strong className="text-indigo-400">T — Task:</strong> Explain your individual responsibility.
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <strong className="text-amber-400">A — Action:</strong> Detail the concrete steps and tools you utilized.
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <strong className="text-sky-400">R — Result:</strong> Share the quantifiable impact and what you learned.
                  </div>
                </div>
              </div>

              {/* Past Sessions List */}
              {sessions.length > 0 && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Past Interview Practice History</span>
                  </h3>
                  <div className="space-y-2">
                    {sessions.slice(0, 4).map(sess => (
                      <div
                        key={sess.id}
                        onClick={() => {
                          setActiveSession(sess);
                          setStage("results");
                        }}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-all"
                      >
                        <div>
                          <div className="font-semibold text-slate-200 capitalize">
                            {sess.category} Round ({sess.difficulty})
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(sess.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {sess.status === "completed" ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {sess.feedback?.overallScore || 75}% Score
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">In Progress</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================
            STAGE 2: INTERVIEWING
           ============================================================== */}
        {stage === "interviewing" && activeSession && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Question {currentIndex + 1} of {activeSession.questions.length}
                </span>
                <span className="text-slate-400 capitalize hidden sm:inline">
                  • {activeSession.category} ({activeSession.difficulty})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-sm text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatTimer(elapsedSeconds)}</span>
                </div>
              </div>
            </div>

            {/* Current Question Card */}
            {(() => {
              const currentQ = activeSession.questions[currentIndex];
              if (!currentQ) return null;

              return (
                <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                  {/* Question Prompt */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Recruiter Prompt:
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                      "{currentQ.question}"
                    </h2>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-slate-300">Your Answer / Response:</label>
                      <span className="text-slate-500 text-[11px]">
                        {(answers[currentQ.id] || "").split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    <textarea
                      rows={9}
                      value={answers[currentQ.id] || ""}
                      onChange={e => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                      placeholder={
                        activeSession.category === "behavioral"
                          ? "Apply the STAR framework: S (Context)... T (My task)... A (Concrete action taken)... R (Result achieved)..."
                          : "Type your structured technical answer, concepts, and architectural decisions here..."
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-emerald-500 focus:outline-none leading-relaxed font-sans"
                    />
                  </div>

                  {/* Navigation & Submit Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(prev => prev - 1)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {currentIndex < activeSession.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleFinishInterview}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{submitting ? "Evaluating..." : "Submit & Review Feedback"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==============================================================
            STAGE 3: RESULTS & RUBRIC EVALUATION
           ============================================================== */}
        {stage === "results" && activeSession && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Score Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 mx-auto">
                <span className="text-3xl font-extrabold text-emerald-400">
                  {activeSession.feedback?.overallScore || 78}%
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Interview Performance Summary</h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                  {activeSession.feedback?.summary || "Good structural foundation. Continue expanding on concrete results and metric achievements."}
                </p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Key Strengths</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {activeSession.feedback?.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Areas to Enhance</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {activeSession.feedback?.improvements?.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Questions & Model Answers Detailed Review */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">Question by Question Rubric Review</h3>

              {activeSession.questions.map((q, qIdx) => {
                const userAns = activeSession.answers?.find(a => a.questionId === q.id);
                return (
                  <div key={q.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Question {qIdx + 1}
                      </span>
                      {userAns?.score !== undefined && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                          Score: {userAns.score}%
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-white">
                      "{q.question}"
                    </h4>

                    {/* User's Answer */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400">Your Submitted Answer:</span>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {userAns?.userAnswer || "No answer provided"}
                      </p>
                    </div>

                    {/* Rubric Feedback */}
                    {userAns?.feedback && (
                      <div className="text-xs text-slate-400 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl space-y-1">
                        <span className="font-semibold text-emerald-300">Rubric Feedback:</span>
                        <p>{userAns.feedback}</p>
                      </div>
                    )}

                    {/* Model Ideal Answer */}
                    <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                      <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Expected Core Concepts / Model Answer:</span>
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {q.modelAnswer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setStage("setup")}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Mock Round</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
