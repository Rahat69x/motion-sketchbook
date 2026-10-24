"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Resume, ATSAnalysis } from "@/lib/types";
import { 
  Target, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  HelpCircle, 
  Clock, 
  Tag,
  ShieldCheck,
  Zap,
  Briefcase
} from "lucide-react";

const SAMPLE_JOB_DESCRIPTIONS = [
  {
    title: "Software Engineer Intern (Full-Stack)",
    company: "Tech Giant / Campus Recruitment",
    text: `Job Description:
We are seeking an energetic Software Engineering Intern to join our engineering team. 
Key Responsibilities:
- Design, develop, test, and deploy robust web applications using React, TypeScript, and Node.js.
- Collaborate with cross-functional teams to build RESTful APIs and microservices with PostgreSQL.
- Write clean, maintainable unit tests using Jest or PyTest.
- Work with Git version control, Docker containers, and CI/CD automation pipelines.
Required Qualifications:
- Pursuing a Bachelor's degree in Computer Science, Software Engineering, or related technical field.
- Strong foundation in Data Structures, Algorithms, Object-Oriented Programming (OOP), and DBMS.
- Experience with JavaScript, Python, Java, or C++.
- Problem-solving mindset, fast learner, and effective communication skills.`
  },
  {
    title: "Frontend Developer (React / Next.js)",
    company: "Product Startup Drive",
    text: `Job Description:
Looking for a passionate Frontend Developer to build responsive, accessible web interfaces.
Requirements:
- Strong command of HTML5, CSS3, JavaScript (ES6+), and TypeScript.
- Hands-on experience building components with React.js, Next.js, and Tailwind CSS.
- Understanding of state management (Redux, Zustand), REST APIs, and GraphQL.
- Knowledge of Web Performance, responsive UI design, and cross-browser compatibility.
- Familiarity with Git, Figma, and modern frontend deployment on Vercel or AWS.`
  },
  {
    title: "Data Analyst / Junior BI Engineer",
    company: "Financial Services Campus Drive",
    text: `Job Description:
We are hiring a Data Analyst Intern to extract insights and support data-driven decision making.
Requirements:
- Proficient in SQL (complex queries, joins, window functions) and Python (Pandas, NumPy).
- Experience building dashboards using Tableau, Power BI, or Matplotlib.
- Strong analytical skills, statistical modeling, data visualization, and problem-solving abilities.
- Good understanding of relational databases and data warehousing concepts.`
  }
];

function ATSCheckerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialResumeId = searchParams.get("resumeId") || "";

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>(initialResumeId);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESCRIPTIONS[0].text);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysis | null>(null);
  const [history, setHistory] = useState<ATSAnalysis[]>([]);
  const [activeInputTab, setActiveInputTab] = useState<"saved" | "paste">("saved");

  useEffect(() => {
    fetchResumes();
    fetchHistory();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resumes");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.resumes) {
        setResumes(data.resumes);
        if (!selectedResumeId && data.resumes.length > 0) {
          setSelectedResumeId(data.resumes[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/ats/history");
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const payload: any = { jobDescription: jobDescription.trim() };
      if (activeInputTab === "saved" && selectedResumeId) {
        payload.resumeId = selectedResumeId;
      } else {
        payload.resumeText = resumeText.trim();
      }

      const res = await fetch("/api/ats/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
        setHistory(prev => [data.analysis, ...prev]);
      }
    } catch (err) {
      console.error("Error analyzing ATS compatibility:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Placement Ready", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (score >= 60) return { label: "Good Match", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" };
    if (score >= 40) return { label: "Needs Improvement", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    return { label: "High Risk", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Target className="w-7 h-7 text-amber-400" />
              <span>ATS Compatibility Checker</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Audit your resume against campus job descriptions. Uncover missing technical keywords, formatting risks, and actionable improvements.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Explainable Scoring Engine</span>
          </div>
        </div>

        {/* Input Form & Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleAnalyze} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Step 1: Choose Resume */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  1. Select Source Resume
                </label>

                <div className="flex items-center gap-2 mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("saved")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      activeInputTab === "saved"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    From My Resumes ({resumes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("paste")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      activeInputTab === "paste"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    Paste Plain Text
                  </button>
                </div>

                {activeInputTab === "saved" ? (
                  resumes.length > 0 ? (
                    <select
                      value={selectedResumeId}
                      onChange={e => setSelectedResumeId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.template} layout — {new Date(r.updatedAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>No resumes saved yet.</span>
                      <Link href="/resumes" className="text-indigo-400 font-semibold hover:underline">
                        Create One Now
                      </Link>
                    </div>
                  )
                ) : (
                  <textarea
                    rows={6}
                    placeholder="Paste the full text of your resume here..."
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                  />
                )}
              </div>

              {/* Step 2: Target Job Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    2. Target Job Description
                  </label>
                  <span className="text-[11px] text-slate-400">Sample Templates:</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {SAMPLE_JOB_DESCRIPTIONS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setJobDescription(sample.text)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Briefcase className="w-3 h-3 text-indigo-400" />
                      <span>{sample.title}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  required
                  placeholder="Paste the target job description or requirements here..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={analyzing || (!selectedResumeId && !resumeText.trim()) || !jobDescription.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Keywords & ATS Formatting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run ATS Compatibility Scan</span>
                  </>
                )}
              </button>
            </form>

            {/* Previous History List */}
            {history.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Previous Scan History</span>
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 4).map(item => {
                    const badge = getScoreBadge(item.score ?? item.overallScore ?? 0);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setAnalysisResult(item)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-all"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">
                            {item.resumeTitle || "Scanned Resume"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${badge.color}`}>
                            {item.score ?? item.overallScore ?? 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Analysis Results (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {analysisResult ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                {/* Score Header */}
                <div className="text-center space-y-3 pb-6 border-b border-slate-800">
                  <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/10 mx-auto">
                    <span className="text-4xl font-extrabold text-amber-400">
                      {analysisResult.score ?? analysisResult.overallScore ?? 0}%
                    </span>
                  </div>

                  <div>
                    {(() => {
                      const badge = getScoreBadge(analysisResult.score ?? analysisResult.overallScore ?? 0);
                      return (
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                          {badge.label}
                        </div>
                      );
                    })()}
                    <p className="text-xs text-slate-400 mt-2">
                      Calculated from keyword density, layout readability & section completeness.
                    </p>
                  </div>
                </div>

                {/* Sub Scores Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Score Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400">Technical Keyword Matching</span>
                        <span className="font-semibold text-slate-200">{analysisResult.breakdown?.keywordScore || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${analysisResult.breakdown?.keywordScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400">Formatting & ATS Parseability</span>
                        <span className="font-semibold text-slate-200">{analysisResult.breakdown?.formatScore || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${analysisResult.breakdown?.formatScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400">Section Completeness</span>
                        <span className="font-semibold text-slate-200">{analysisResult.breakdown?.sectionScore || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${analysisResult.breakdown?.sectionScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400">Action Verbs Quality</span>
                        <span className="font-semibold text-slate-200">{analysisResult.breakdown?.verbsScore || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${analysisResult.breakdown?.verbsScore || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keywords Matched vs Missing */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Matched Keywords ({analysisResult.matchedKeywords?.length || 0})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.matchedKeywords?.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Missing Critical Keywords ({analysisResult.missingKeywords?.length || 0})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.missingKeywords?.map(kw => (
                        <span key={kw} className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formatting Warnings */}
                {analysisResult.formattingRisks && analysisResult.formattingRisks.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Formatting & Content Warnings</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {analysisResult.formattingRisks.map((risk, idx) => (
                        <li key={idx} className="text-slate-400">
                          <span className="text-slate-300">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Actionable Recommendations</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {analysisResult.recommendations?.map((rec, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Awaiting Scan Placeholder */
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-white">No Scan Performed Yet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Select your resume and a target job description on the left, then click <strong>Run ATS Compatibility Scan</strong>.
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-slate-500">
                  Transparency Notice: Our engine checks lexical matches, readability heuristics, and section compliance.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ATSCheckerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    }>
      <ATSCheckerContent />
    </Suspense>
  );
}
