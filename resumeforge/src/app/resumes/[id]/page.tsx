"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ResumePreview from "@/components/ResumePreview";
import { Resume, Education, Experience, Project, Certification, Achievement } from "@/lib/types";
import { 
  FileText, 
  Save, 
  Printer, 
  ArrowLeft, 
  Layout, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Eye, 
  Code2, 
  GraduationCap, 
  Briefcase, 
  Award, 
  Globe, 
  Target,
  ExternalLink
} from "lucide-react";

function ResumeEditorContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const resumeId = resolvedParams.id;

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "summary" | "education" | "skills" | "experience" | "projects" | "certifications" | "achievements"
  >("personal");
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");

  useEffect(() => {
    fetchResume();
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.resume) {
        setResume(data.resume);
      }
    } catch (err) {
      console.error("Failed to load resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save resume:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (viewMode === "editor") {
      setViewMode("preview");
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
          <h2 className="text-xl font-bold">Resume not found</h2>
          <Link href="/resumes" className="text-indigo-400 hover:underline">
            Return to Resumes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar />
      </div>

      {/* Editor Control Header */}
      <div className="no-print border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/resumes"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <input
              type="text"
              value={resume.title}
              onChange={e => setResume({ ...resume, title: e.target.value })}
              className="bg-transparent font-bold text-base sm:text-lg text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 rounded"
            />
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Template: <strong className="text-slate-300 capitalize">{resume.template}</strong></span>
              <span>•</span>
              <Link
                href={`/ats-checker?resumeId=${resume.id}`}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <Target className="w-3 h-3" />
                <span>Check ATS Score</span>
              </Link>
            </div>
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Template Switcher */}
          <select
            value={resume.template}
            onChange={e => setResume({ ...resume, template: e.target.value as any })}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="modern">Modern Tech</option>
            <option value="classic">Executive Classic</option>
            <option value="minimal">Minimalist Clean</option>
          </select>

          {/* View Mode Switcher */}
          <div className="hidden md:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode("editor")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === "editor" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === "split" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === "preview" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Preview
            </button>
          </div>

          {/* Export PDF / Print */}
          <button
            onClick={handlePrint}
            title="Export to PDF or Print"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Draft"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Column */}
        {(viewMode === "editor" || viewMode === "split") && (
          <div className={`no-print flex-1 border-r border-slate-800 overflow-y-auto p-4 sm:p-6 space-y-6 ${viewMode === "split" ? "max-w-2xl" : "max-w-4xl mx-auto w-full"}`}>
            {/* Section Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs scrollbar-thin">
              {[
                { id: "personal", label: "Contact", icon: Globe },
                { id: "summary", label: "Objective", icon: FileText },
                { id: "education", label: "Education", icon: GraduationCap },
                { id: "skills", label: "Skills", icon: Code2 },
                { id: "experience", label: "Experience", icon: Briefcase },
                { id: "projects", label: "Projects", icon: Sparkles },
                { id: "certifications", label: "Certs", icon: Award },
                { id: "achievements", label: "Honors", icon: Target }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: Personal Information */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Contact & Personal Details</h3>
                  <span className="text-xs text-slate-500">Ensure email & phone are clean for ATS scanners</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resume.personalInfo.fullName}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, fullName: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Professional Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Aspiring Software Development Engineer"
                      value={resume.personalInfo.title || ""}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={resume.personalInfo.email}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={resume.personalInfo.phone}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Jose, CA / Open to Relocation"
                      value={resume.personalInfo.location}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, location: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      placeholder="linkedin.com/in/username"
                      value={resume.personalInfo.linkedin || ""}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, linkedin: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Profile</label>
                    <input
                      type="text"
                      placeholder="github.com/username"
                      value={resume.personalInfo.github || ""}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, github: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      placeholder="portfolio.dev"
                      value={resume.personalInfo.website || ""}
                      onChange={e => setResume({
                        ...resume,
                        personalInfo: { ...resume.personalInfo, website: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Career Objective / Summary */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Professional Summary / Placement Objective</h3>
                  <span className="text-xs text-slate-500">2-4 sentences max</span>
                </div>

                <textarea
                  rows={6}
                  value={resume.summary}
                  onChange={e => setResume({ ...resume, summary: e.target.value })}
                  placeholder="e.g. Highly motivated Computer Science student with strong fundamentals in Data Structures, Algorithms, and Full-Stack Web Development..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none leading-relaxed"
                />

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300">ATS Recommendation:</span>
                  <p>Keep your summary concise. Highlight your degree, core languages (e.g. Java, Python, TypeScript), and eagerness to deliver high-quality code in production environments.</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Education */}
            {activeTab === "education" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Education & Academics</h3>
                  <button
                    onClick={() => {
                      const newEdu: Education = {
                        id: `edu-${Date.now()}`,
                        institution: "",
                        degree: "Bachelor of Technology",
                        fieldOfStudy: "Computer Science and Engineering",
                        startDate: "2022",
                        endDate: "2026",
                        gpa: "",
                        highlights: []
                      };
                      setResume({ ...resume, education: [...resume.education, newEdu] });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Institution</span>
                  </button>
                </div>

                {resume.education.map((edu, idx) => (
                  <div key={edu.id || idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative group">
                    <button
                      onClick={() => {
                        const updated = resume.education.filter((_, i) => i !== idx);
                        setResume({ ...resume, education: updated });
                      }}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove Education"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">University / College</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={e => {
                            const updated = [...resume.education];
                            updated[idx].institution = e.target.value;
                            setResume({ ...resume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={e => {
                            const updated = [...resume.education];
                            updated[idx].degree = e.target.value;
                            setResume({ ...resume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Major / Branch</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={e => {
                            const updated = [...resume.education];
                            updated[idx].fieldOfStudy = e.target.value;
                            setResume({ ...resume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">CGPA / Percentage</label>
                        <input
                          type="text"
                          placeholder="e.g. 3.8 / 4.0 or 8.9 / 10"
                          value={edu.gpa || ""}
                          onChange={e => {
                            const updated = [...resume.education];
                            updated[idx].gpa = e.target.value;
                            setResume({ ...resume, education: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Year</label>
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={e => {
                              const updated = [...resume.education];
                              updated[idx].startDate = e.target.value;
                              setResume({ ...resume, education: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">End / Expected</label>
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={e => {
                              const updated = [...resume.education];
                              updated[idx].endDate = e.target.value;
                              setResume({ ...resume, education: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: Skills */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Technical & Professional Skills</h3>
                  <span className="text-xs text-slate-500">Comma-separated entries</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Programming Languages</label>
                  <input
                    type="text"
                    placeholder="Java, Python, C++, TypeScript, SQL"
                    value={resume.skills.languages?.join(", ") || ""}
                    onChange={e => {
                      const items = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setResume({ ...resume, skills: { ...resume.skills, languages: items } });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Frameworks & Libraries</label>
                  <input
                    type="text"
                    placeholder="React, Next.js, Node.js, Express, Spring Boot"
                    value={resume.skills.frameworks?.join(", ") || ""}
                    onChange={e => {
                      const items = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setResume({ ...resume, skills: { ...resume.skills, frameworks: items } });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Developer Tools & Databases</label>
                  <input
                    type="text"
                    placeholder="Git, GitHub, Docker, PostgreSQL, MongoDB, Postman"
                    value={resume.skills.tools?.join(", ") || ""}
                    onChange={e => {
                      const items = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setResume({ ...resume, skills: { ...resume.skills, tools: items } });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Core CS Concepts</label>
                  <input
                    type="text"
                    placeholder="Data Structures & Algorithms, OOP, Database Management (DBMS), Operating Systems"
                    value={resume.skills.concepts?.join(", ") || ""}
                    onChange={e => {
                      const items = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                      setResume({ ...resume, skills: { ...resume.skills, concepts: items } });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: Projects */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Projects (Crucial for Campus Placements)</h3>
                  <button
                    onClick={() => {
                      const newProj: Project = {
                        id: `proj-${Date.now()}`,
                        title: "New Project",
                        technologies: ["React", "TypeScript", "Node.js"],
                        link: "github.com/...",
                        bullets: ["Designed and implemented full-stack feature with secure authentication."]
                      };
                      setResume({ ...resume, projects: [...resume.projects, newProj] });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {resume.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative">
                    <button
                      onClick={() => {
                        const updated = resume.projects.filter((_, i) => i !== idx);
                        setResume({ ...resume, projects: updated });
                      }}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1"
                      title="Remove Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={e => {
                            const updated = [...resume.projects];
                            updated[idx].title = e.target.value;
                            setResume({ ...resume, projects: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Project Link / Repo</label>
                        <input
                          type="text"
                          value={proj.link || ""}
                          onChange={e => {
                            const updated = [...resume.projects];
                            updated[idx].link = e.target.value;
                            setResume({ ...resume, projects: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tech Stack (comma-separated)</label>
                      <input
                        type="text"
                        value={proj.technologies?.join(", ") || ""}
                        onChange={e => {
                          const updated = [...resume.projects];
                          updated[idx].technologies = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          setResume({ ...resume, projects: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Bullet Points (one per line, use strong action verbs like Built, Optimized, Engineered)
                      </label>
                      <textarea
                        rows={3}
                        value={proj.bullets?.join("\n") || ""}
                        onChange={e => {
                          const updated = [...resume.projects];
                          updated[idx].bullets = e.target.value.split("\n").filter(Boolean);
                          setResume({ ...resume, projects: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: Experience */}
            {activeTab === "experience" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white">Work Experience & Internships</h3>
                    <p className="text-xs text-slate-500">Includes part-time, campus tech roles, or internships</p>
                  </div>
                  <button
                    onClick={() => {
                      const newExp: Experience = {
                        id: `exp-${Date.now()}`,
                        company: "Company Name",
                        role: "Software Engineering Intern",
                        location: "Remote",
                        startDate: "June 2025",
                        endDate: "August 2025",
                        current: false,
                        bullets: ["Collaborated with senior engineers to build scalable RESTful endpoints."]
                      };
                      setResume({ ...resume, experience: [...resume.experience, newExp] });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Experience</span>
                  </button>
                </div>

                {resume.experience.map((exp, idx) => (
                  <div key={exp.id || idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative">
                    <button
                      onClick={() => {
                        const updated = resume.experience.filter((_, i) => i !== idx);
                        setResume({ ...resume, experience: updated });
                      }}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1"
                      title="Remove Experience"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Company / Organization</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={e => {
                            const updated = [...resume.experience];
                            updated[idx].company = e.target.value;
                            setResume({ ...resume, experience: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={e => {
                            const updated = [...resume.experience];
                            updated[idx].role = e.target.value;
                            setResume({ ...resume, experience: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Start Date"
                            value={exp.startDate}
                            onChange={e => {
                              const updated = [...resume.experience];
                              updated[idx].startDate = e.target.value;
                              setResume({ ...resume, experience: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="End Date"
                            value={exp.endDate}
                            onChange={e => {
                              const updated = [...resume.experience];
                              updated[idx].endDate = e.target.value;
                              setResume({ ...resume, experience: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Location</label>
                        <input
                          type="text"
                          value={exp.location || ""}
                          onChange={e => {
                            const updated = [...resume.experience];
                            updated[idx].location = e.target.value;
                            setResume({ ...resume, experience: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Impact & Contributions (one per line, quantify results like "increased speed by 25%")
                      </label>
                      <textarea
                        rows={3}
                        value={exp.bullets?.join("\n") || ""}
                        onChange={e => {
                          const updated = [...resume.experience];
                          updated[idx].bullets = e.target.value.split("\n").filter(Boolean);
                          setResume({ ...resume, experience: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: Certifications */}
            {activeTab === "certifications" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Certifications & Accreditations</h3>
                  <button
                    onClick={() => {
                      const newCert: Certification = {
                        id: `cert-${Date.now()}`,
                        name: "AWS Certified Cloud Practitioner",
                        issuer: "Amazon Web Services",
                        issueDate: "2025"
                      };
                      setResume({ ...resume, certifications: [...resume.certifications, newCert] });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certificate</span>
                  </button>
                </div>

                {resume.certifications.map((cert, idx) => (
                  <div key={cert.id || idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                    <button
                      onClick={() => {
                        const updated = resume.certifications.filter((_, i) => i !== idx);
                        setResume({ ...resume, certifications: updated });
                      }}
                      className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Certification Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={e => {
                          const updated = [...resume.certifications];
                          updated[idx].name = e.target.value;
                          setResume({ ...resume, certifications: updated });
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Issuing Authority</label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={e => {
                          const updated = [...resume.certifications];
                          updated[idx].issuer = e.target.value;
                          setResume({ ...resume, certifications: updated });
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Date</label>
                      <input
                        type="text"
                        value={cert.issueDate}
                        onChange={e => {
                          const updated = [...resume.certifications];
                          updated[idx].issueDate = e.target.value;
                          setResume({ ...resume, certifications: updated });
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: Achievements */}
            {activeTab === "achievements" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Honors, Hackathons & Extracurriculars</h3>
                  <button
                    onClick={() => {
                      const newAch: Achievement = {
                        id: `ach-${Date.now()}`,
                        title: "1st Place - University Hackathon 2025",
                        description: "Developed an AI-powered accessibility tool competing against 50+ campus teams."
                      };
                      setResume({ ...resume, achievements: [...resume.achievements, newAch] });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Achievement</span>
                  </button>
                </div>

                {resume.achievements.map((ach, idx) => (
                  <div key={ach.id || idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
                    <button
                      onClick={() => {
                        const updated = resume.achievements.filter((_, i) => i !== idx);
                        setResume({ ...resume, achievements: updated });
                      }}
                      className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Award / Title</label>
                      <input
                        type="text"
                        value={ach.title}
                        onChange={e => {
                          const updated = [...resume.achievements];
                          updated[idx].title = e.target.value;
                          setResume({ ...resume, achievements: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Description / Proof</label>
                      <input
                        type="text"
                        value={ach.description || ""}
                        onChange={e => {
                          const updated = [...resume.achievements];
                          updated[idx].description = e.target.value;
                          setResume({ ...resume, achievements: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Resume Preview Column */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-8 flex justify-center">
            <div className="w-full max-w-[210mm] shadow-2xl">
              <ResumePreview resume={resume} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumeEditorPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
        </div>
      }
    >
      <ResumeEditorContent {...props} />
    </Suspense>
  );
}
