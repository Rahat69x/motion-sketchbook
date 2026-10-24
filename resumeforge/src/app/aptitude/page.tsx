"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { AptitudeQuestion, AptitudeAttempt } from "@/lib/types";
import { 
  Compass, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Play, 
  HelpCircle,
  BarChart2,
  BookOpen,
  Filter
} from "lucide-react";

export default function AptitudePage() {
  const router = useRouter();

  // Mode: 'menu' | 'active' | 'summary'
  const [viewState, setViewState] = useState<"menu" | "active" | "summary">("menu");
  const [history, setHistory] = useState<AptitudeAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [examMode, setExamMode] = useState<"practice" | "timed">("practice");
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Active Test State
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedInPractice, setRevealedInPractice] = useState<Record<string, boolean>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, { correct: boolean; correctIndex?: number; explanation?: string }>>({});
  
  // Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 mins default
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Final graded result
  const [gradedResult, setGradedResult] = useState<any | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Timer for test
  useEffect(() => {
    let interval: any = null;
    if (viewState === "active") {
      interval = setInterval(() => {
        setTimeSpentSeconds(prev => prev + 1);
        if (examMode === "timed") {
          setTimeLeftSeconds(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              handleSubmitTest();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [viewState, examMode]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/aptitude/history");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load aptitude history:", err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (category !== "all") query.set("category", category);
      if (difficulty !== "all") query.set("difficulty", difficulty);
      query.set("limit", questionCount.toString());

      const res = await fetch(`/api/aptitude/questions?${query.toString()}`);
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setRevealedInPractice({});
        setPracticeFeedback({});
        setTimeSpentSeconds(0);
        setTimeLeftSeconds(data.questions.length * 60); // 1 min per question
        setViewState("active");
      } else {
        alert("No questions found matching your selected filters.");
      }
    } catch (err) {
      console.error("Failed to start aptitude test:", err);
    } finally {
      setLoading(false);
    }
  };

  // Immediate check in Practice mode
  const handleSelectAnswer = async (qId: string, optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));

    if (examMode === "practice") {
      setRevealedInPractice(prev => ({ ...prev, [qId]: true }));
      // Call server to grade this single question and get explanation
      try {
        const res = await fetch("/api/aptitude/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses: [{ questionId: qId, selectedOption: optionIdx }],
            timeSpentSeconds: 0
          })
        });
        const data = await res.json();
        if (data.attempt && data.attempt.answers && data.attempt.answers.length > 0) {
          const graded = data.attempt.answers[0];
          setPracticeFeedback(prev => ({
            ...prev,
            [qId]: {
              correct: graded.isCorrect,
              correctIndex: graded.correctOption,
              explanation: graded.explanation
            }
          }));
        }
      } catch (err) {
        console.error("Error evaluating practice answer:", err);
      }
    }
  };

  // Complete and submit test
  const handleSubmitTest = async () => {
    setSubmitting(true);
    try {
      const responses = questions.map(q => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
      }));

      const res = await fetch("/api/aptitude/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          timeSpentSeconds
        })
      });
      const data = await res.json();
      if (data.attempt) {
        setGradedResult(data.attempt);
        setViewState("summary");
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to submit test:", err);
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
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Compass className="w-7 h-7 text-sky-400" />
              <span>Campus Placement Aptitude Practice</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Master Quantitative, Logical Reasoning, Verbal, and Data Interpretation screening tests.
            </p>
          </div>

          {viewState !== "menu" && (
            <button
              onClick={() => {
                if (window.confirm("Return to aptitude home? Current session will be closed.")) {
                  setViewState("menu");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Exit to Menu</span>
            </button>
          )}
        </div>

        {/* ==============================================================
            VIEW 1: MENU & CONFIGURATION
           ============================================================== */}
        {viewState === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Setup Card */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-md">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-sky-400" />
                  <span>Configure Your Practice Session</span>
                </h3>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Aptitude Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "all", label: "All Categories", desc: "Balanced placement mix" },
                      { id: "quantitative", label: "Quantitative", desc: "Speed math, algebra, arithmetic" },
                      { id: "logical", label: "Logical Reasoning", desc: "Puzzles, coding, patterns" },
                      { id: "verbal", label: "Verbal Ability", desc: "Grammar, vocabulary, passage" },
                      { id: "data-interpretation", label: "Data Interpretation", desc: "Charts, percentages, tables" }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          category === cat.id
                            ? "border-sky-500 bg-sky-500/10 text-white"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-200">{cat.label}</div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{cat.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode: Practice vs Timed */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Training Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExamMode("practice")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        examMode === "practice"
                          ? "border-sky-500 bg-sky-500/15 text-white"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-200 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                        <span>Practice Mode</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Instant feedback after each question with step-by-step explanations.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExamMode("timed")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        examMode === "timed"
                          ? "border-amber-500 bg-amber-500/15 text-white"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-200 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Timed Test Mode</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Real exam pressure with a countdown clock and final score card.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Difficulty & Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-sky-500 focus:outline-none"
                    >
                      <option value="all">Mixed (Standard Campus Mix)</option>
                      <option value="easy">Easy (Fundamentals)</option>
                      <option value="medium">Medium (Top IT & Product Drives)</option>
                      <option value="hard">Hard (Tier-1 Tech Companies)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Number of Questions
                    </label>
                    <select
                      value={questionCount}
                      onChange={e => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-sky-500 focus:outline-none"
                    >
                      <option value={5}>5 Questions (5 mins)</option>
                      <option value={10}>10 Questions (10 mins)</option>
                      <option value={15}>15 Questions (15 mins)</option>
                    </select>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  type="button"
                  onClick={startTest}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Aptitude Drills</span>
                </button>
              </div>
            </div>

            {/* Right: Past Attempts History */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-sky-400" />
                  <span>Your Previous Aptitude Attempts</span>
                </h3>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No completed tests yet. Start your first session to track accuracy and speed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 5).map(att => (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">
                            {att.score} / {att.totalQuestions} Correct ({att.accuracy}%)
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(att.completedAt || att.createdAt || Date.now()).toLocaleString()} • {Math.round(att.timeSpentSeconds)}s
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                          att.accuracy >= 75
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : att.accuracy >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                          {att.accuracy}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            VIEW 2: ACTIVE TEST / PRACTICE
           ============================================================== */}
        {viewState === "active" && questions.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-slate-400 capitalize hidden sm:inline">
                  • {questions[currentIndex]?.category} ({questions[currentIndex]?.difficulty})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-sm text-sky-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {examMode === "timed" ? formatTimer(timeLeftSeconds) : formatTimer(timeSpentSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Card */}
            {(() => {
              const currentQ = questions[currentIndex];
              if (!currentQ) return null;

              const isAnswered = selectedAnswers[currentQ.id] !== undefined;
              const feedback = practiceFeedback[currentQ.id];

              return (
                <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                  {/* Question Text */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                      Question Prompt:
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                      {currentQ.questionText || currentQ.question}
                    </h2>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {((Array.isArray(currentQ.options) ? currentQ.options : Object.values(currentQ.options || {})) as string[]).map((opt: string, optIdx: number) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;

                      let btnStyle = "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700";

                      if (isSelected) {
                        btnStyle = "border-sky-500 bg-sky-500/15 text-white font-semibold";
                      }

                      // Practice mode reveals immediate red/green
                      if (examMode === "practice" && feedback) {
                        if (optIdx === feedback.correctIndex) {
                          btnStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-200 font-semibold";
                        } else if (isSelected && !feedback.correct) {
                          btnStyle = "border-rose-500 bg-rose-500/20 text-rose-200 font-semibold";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                          className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {examMode === "practice" && feedback && (
                            <div>
                              {optIdx === feedback.correctIndex ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : isSelected && !feedback.correct ? (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              ) : null}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Practice Mode Explanation Box */}
                  {examMode === "practice" && feedback && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-sky-400">
                        <Sparkles className="w-4 h-4" />
                        <span>Step-by-Step Mathematical / Logical Solution:</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {feedback.explanation}
                      </p>
                    </div>
                  )}

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

                    {currentIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-all"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmitTest}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{submitting ? "Grading..." : "Finish Test & View Score"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==============================================================
            VIEW 3: RESULTS SUMMARY
           ============================================================== */}
        {viewState === "summary" && gradedResult && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-sky-500/40 bg-sky-500/10 shadow-lg shadow-sky-500/10 mx-auto">
                <span className="text-3xl font-extrabold text-sky-400">
                  {gradedResult.accuracy}%
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">Aptitude Test Scorecard</h2>
                <p className="text-xs text-slate-400">
                  Completed in {Math.round(gradedResult.timeSpentSeconds)} seconds
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 max-w-md mx-auto">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-emerald-400">{gradedResult.score}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Correct</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-rose-400">
                    {gradedResult.totalQuestions - gradedResult.score}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Incorrect</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-sky-400">{gradedResult.totalQuestions}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Total</div>
                </div>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">Answer Explanations & Review</h3>

              {gradedResult.answers?.map((ans: any, idx: number) => {
                const questionObj = questions.find(q => q.id === ans.questionId);
                return (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        ans.isCorrect
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {ans.isCorrect ? "Correct (+1)" : "Incorrect"}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">
                      {questionObj?.question}
                    </h4>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div>
                        <span className="text-slate-400">Your Answer: </span>
                        <span className={ans.isCorrect ? "text-emerald-300 font-semibold" : "text-rose-300 font-semibold"}>
                          {ans.selectedOption >= 0 ? questionObj?.options[ans.selectedOption] : "Unanswered"}
                        </span>
                      </div>
                      {!ans.isCorrect && (
                        <div>
                          <span className="text-slate-400">Correct Answer: </span>
                          <span className="text-emerald-300 font-semibold">
                            {questionObj?.options[ans.correctOption]}
                          </span>
                        </div>
                      )}
                    </div>

                    {ans.explanation && (
                      <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs space-y-1">
                        <span className="font-semibold text-sky-300">Explanation:</span>
                        <p className="text-slate-300 leading-relaxed">{ans.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setViewState("menu")}
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Aptitude Round</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
