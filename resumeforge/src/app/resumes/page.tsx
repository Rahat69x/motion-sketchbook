"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Resume } from "@/lib/types";
import { 
  FileText, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Clock, 
  Layout, 
  AlertCircle,
  ExternalLink,
  Target
} from "lucide-react";

export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTemplate, setNewTemplate] = useState<"modern" | "classic" | "minimal">("modern");
  const [targetRole, setTargetRole] = useState("Software Engineering Intern");

  useEffect(() => {
    fetchResumes();
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
      }
    } catch (err) {
      console.error("Error fetching resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setActionLoading("create");
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          template: newTemplate,
          targetRole: targetRole.trim()
        })
      });
      const data = await res.json();
      if (data.resume) {
        setShowCreateModal(false);
        setNewTitle("");
        router.push(`/resumes/${data.resume.id}`);
      }
    } catch (err) {
      console.error("Failed to create resume:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(`dup-${id}`);
    try {
      const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.resume) {
        setResumes([data.resume, ...resumes]);
      }
    } catch (err) {
      console.error("Failed to duplicate resume:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(`del-${id}`);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setResumes(resumes.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete resume:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-indigo-400" />
              <span>Resume Management</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create, customize, and tailor multiple resume versions for campus placement drives and job applications.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Resume</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 p-6" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No resumes created yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Build your first placement-ready resume now. We provide pre-filled college-friendly sections including coursework, projects, and certifications.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Resume</span>
            </button>
          </div>
        ) : (
          /* Resumes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map(r => (
              <div
                key={r.id}
                onClick={() => router.push(`/resumes/${r.id}`)}
                className="group relative p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {r.template} Template
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                    {r.title}
                  </h3>

                  <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Target: {r.personalInfo?.fullName || "Student Profile"}</span>
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between">
                      <span>Education:</span>
                      <span className="text-slate-200 font-medium">{r.education?.length || 0} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects:</span>
                      <span className="text-slate-200 font-medium">{r.projects?.length || 0} projects</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skills listed:</span>
                      <span className="text-slate-200 font-medium">
                        {(r.skills?.languages?.length || 0) + (r.skills?.frameworks?.length || 0)} skills
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:underline">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Open Editor</span>
                  </span>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => handleDuplicate(r.id, e)}
                      disabled={actionLoading === `dup-${r.id}`}
                      title="Duplicate Resume"
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => handleDelete(r.id, r.title, e)}
                      disabled={actionLoading === `del-${r.id}`}
                      title="Delete Resume"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Student Advice Callout */}
        <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-indigo-200">Placement Preparation Tip</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Always tailor your resume for specific job roles. For example, create one version tailored for <strong>Frontend/Web Roles</strong> highlighting React and UI projects, and another for <strong>Backend/Core SDE Roles</strong> emphasizing Data Structures, Systems, and APIs. Use our <strong>ATS Checker</strong> to test both versions!
            </p>
          </div>
        </div>
      </main>

      {/* Create Resume Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Create New Resume</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateResume} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Resume Title / Target Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDE Internship - Fall 2026"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer / Frontend Developer"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Template Layout
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "modern", name: "Modern Tech", desc: "Accent bars, clean badges" },
                    { id: "classic", name: "Executive", desc: "Traditional serif, high ATS" },
                    { id: "minimal", name: "Minimalist", desc: "Sleek monochrome line" }
                  ].map(tmpl => (
                    <button
                      type="button"
                      key={tmpl.id}
                      onClick={() => setNewTemplate(tmpl.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        newTemplate === tmpl.id
                          ? "border-indigo-500 bg-indigo-500/15 text-white"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{tmpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "create" || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {actionLoading === "create" ? "Creating..." : "Create & Open"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
