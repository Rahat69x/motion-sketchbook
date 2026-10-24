import Link from "next/link";
import { 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Compass, 
  BrainCircuit, 
  ArrowRight, 
  Award, 
  Target, 
  ShieldCheck, 
  Users, 
  GraduationCap
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                ResumeForge
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Placement Suite 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Engineered specifically for university placement drives & internships</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              From Campus to Offer Letter.{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-amber-300 to-indigo-300 bg-clip-text text-transparent">
                All-in-One Placement Prep.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Build ATS-optimized resumes, simulate behavioral STAR & technical interviews, and master placement aptitude tests with explainable AI scoring and real database tracking.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:scale-[1.02]"
              >
                <span>Launch Free Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all"
              >
                <span>Demo Student Sign In (1-Click)</span>
              </Link>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-2xl font-bold text-indigo-400">92.4%</div>
                <div className="text-xs text-slate-400 mt-1">Average ATS Score Improvement</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-400">40+</div>
                <div className="text-xs text-slate-400 mt-1">Placement Aptitude Questions</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-400">STAR</div>
                <div className="text-xs text-slate-400 mt-1">Structured Interview Feedback</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <div className="text-2xl font-bold text-sky-400">100%</div>
                <div className="text-xs text-slate-400 mt-1">Isolated & Private Data</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Everything You Need to Clear Campus Recruitment
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Four dedicated placement tools integrated into one seamless workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Resume Builder</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Multi-resume editor with Modern, Executive & Minimalist templates. Tailored for college students with projects, certifications & coursework.
                </p>
              </div>
              <Link
                href="/resumes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <span>Create Resume</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">ATS Checker</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Audit your resume against real job descriptions. Get transparent keyword matching, missing skills, formatting risk audits and action verbs advice.
                </p>
              </div>
              <Link
                href="/ats-checker"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                <span>Scan Compatibility</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Mock Interview</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Simulate HR, Behavioral (STAR format), Technical, and System Design rounds. Practice with optional timer and get instant structured rubrics.
                </p>
              </div>
              <Link
                href="/mock-interview"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-sky-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">Aptitude Tests</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">
                  Crack the initial screening round with Quantitative, Logical Reasoning, Verbal, and Data Interpretation drills in Practice or Timed mode.
                </p>
              </div>
              <Link
                href="/aptitude"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300"
              >
                <span>Solve Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Workflow Showcase Banner */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Ready to land your dream internship or graduate job?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Join thousands of students preparing with ResumeForge. Sign in with the preloaded demo account to explore all tools instantly.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <span>Sign In & Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>© 2026 ResumeForge. Designed for university students, campus placements, and graduate recruitment.</p>
      </footer>
    </div>
  );
}
