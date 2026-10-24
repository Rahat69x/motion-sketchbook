"use client";

import React from "react";
import { Resume } from "@/lib/types";
import { Mail, Phone, MapPin, Globe, Code2, ExternalLink } from "lucide-react";

interface ResumePreviewProps {
  resume: Resume;
}

function hasItems<T>(arr?: T[]): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

export default function ResumePreview({ resume }: ResumePreviewProps) {
  const { template } = resume;

  if (template === "classic") {
    return <ClassicTemplate resume={resume} />;
  }

  if (template === "minimal") {
    return <MinimalTemplate resume={resume} />;
  }

  return <ModernTemplate resume={resume} />;
}

// ============================================================================
// 1. MODERN TECH TEMPLATE (Clean Indigo/Slate Accents)
// ============================================================================
function ModernTemplate({ resume }: { resume: Resume }) {
  const { personalInfo, education, skills, experience, projects, certifications, achievements, summary } = resume;

  return (
    <div
      id="resume-printable-document"
      className="w-full bg-white text-slate-900 p-8 sm:p-10 shadow-xl rounded-xl border border-slate-200 font-sans leading-relaxed selection:bg-amber-100 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
    >
      {/* Header */}
      <header className="border-b-2 border-slate-900 pb-5 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        {personalInfo.title && (
          <p className="text-sm font-semibold text-indigo-700 mt-0.5">
            {personalInfo.title}
          </p>
        )}
        {summary && (
          <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-snug max-w-3xl">
            {summary}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600">
          {personalInfo.email && (
            <span className="flex items-center gap-1.5 hover:text-slate-900">
              <Mail className="h-3 w-3 text-amber-600" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-amber-600" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-amber-600" />
              {personalInfo.location}
            </span>
          )}
          {personalInfo.linkedin && (
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Globe className="h-3 w-3" />
              {personalInfo.linkedin}
            </span>
          )}
          {personalInfo.github && (
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Code2 className="h-3 w-3" />
              {personalInfo.github}
            </span>
          )}
        </div>
      </header>

      {/* Technical Skills */}
      {skills && (hasItems(skills.languages) || hasItems(skills.frameworks) || hasItems(skills.tools) || hasItems(skills.concepts)) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-1 mb-2">
            Technical Proficiencies
          </h2>
          <div className="grid grid-cols-1 gap-1 text-xs text-slate-800">
            {hasItems(skills.languages) && (
              <p>
                <strong className="text-slate-950 font-semibold">Languages: </strong>
                {skills.languages.join(", ")}
              </p>
            )}
            {hasItems(skills.frameworks) && (
              <p>
                <strong className="text-slate-950 font-semibold">Frameworks & Libraries: </strong>
                {skills.frameworks.join(", ")}
              </p>
            )}
            {hasItems(skills.tools) && (
              <p>
                <strong className="text-slate-950 font-semibold">Developer Tools & Databases: </strong>
                {skills.tools.join(", ")}
              </p>
            )}
            {hasItems(skills.concepts) && (
              <p>
                <strong className="text-slate-950 font-semibold">Core Competencies: </strong>
                {skills.concepts.join(", ")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Key Projects */}
      {hasItems(projects) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-1 mb-2.5">
            Key Software Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="print-avoid-break">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <span className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                    {proj.title}
                    {proj.link && (
                      <span className="text-[10px] font-normal text-indigo-600 underline">
                        [{proj.link}]
                      </span>
                    )}
                  </span>
                  {hasItems(proj.technologies) && (
                    <span className="text-[11px] font-medium text-slate-500">
                      {proj.technologies.join(" • ")}
                    </span>
                  )}
                </div>
                {hasItems(proj.bullets) && (
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-800">
                    {proj.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience / Internships */}
      {hasItems(experience) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-1 mb-2.5">
            Internship & Work Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id} className="print-avoid-break">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-950">{exp.role}</span>
                    <span className="text-xs font-semibold text-slate-700"> — {exp.company}</span>
                    {exp.location && <span className="text-xs text-slate-500"> ({exp.location})</span>}
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                {hasItems(exp.bullets) && (
                  <ul className="mt-1 list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-800">
                    {exp.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {hasItems(education) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-1 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="print-avoid-break text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-950 text-sm">{edu.institution}</span>
                  <span className="text-slate-600 font-medium">
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
                <p className="text-slate-800">
                  {edu.degree} in {edu.fieldOfStudy} {edu.gpa && `• GPA: ${edu.gpa}`}
                </p>
                {edu.highlights && (
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {Array.isArray(edu.highlights) ? edu.highlights.join(", ") : edu.highlights}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Achievements */}
      {((hasItems(certifications)) || (hasItems(achievements))) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-1 mb-2">
            Honors, Certifications & Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {certifications?.map((c) => (
              <div key={c.id}>
                <span className="font-semibold text-slate-950">{c.name}</span>
                <span className="text-slate-600"> ({c.issuer}, {c.issueDate})</span>
              </div>
            ))}
            {achievements?.map((a) => (
              <div key={a.id}>
                <span className="font-semibold text-slate-950">{a.title}</span>
                {a.description && <p className="text-[11px] text-slate-600">{a.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// 2. EXECUTIVE CLASSIC TEMPLATE (Timeless Serif)
// ============================================================================
function ClassicTemplate({ resume }: { resume: Resume }) {
  const { personalInfo, education, skills, experience, projects, summary } = resume;

  return (
    <div
      id="resume-printable-document"
      className="w-full bg-white text-slate-900 p-8 sm:p-10 shadow-xl rounded-xl border border-slate-200 font-serif leading-relaxed print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
    >
      {/* Centered Classic Header */}
      <header className="text-center border-b border-slate-400 pb-4 mb-5">
        <h1 className="text-2xl font-bold tracking-normal text-slate-950 uppercase font-serif">
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        <div className="mt-1 flex flex-wrap justify-center items-center gap-x-3 text-xs text-slate-700">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.email && <span>• {personalInfo.email}</span>}
          {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
          {personalInfo.github && <span>• {personalInfo.github}</span>}
        </div>
        {summary && (
          <p className="mt-2 text-xs text-slate-800 text-justify max-w-2xl mx-auto italic">
            {summary}
          </p>
        )}
      </header>

      {/* Education First (Academic Focus) */}
      {hasItems(education) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="print-avoid-break text-xs mb-2">
              <div className="flex justify-between font-bold text-slate-950">
                <span>{edu.institution}</span>
                <span>{edu.startDate} – {edu.endDate}</span>
              </div>
              <div className="flex justify-between text-slate-800 italic">
                <span>{edu.degree} in {edu.fieldOfStudy}</span>
                {edu.gpa && <span>GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {hasItems(experience) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Professional Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="print-avoid-break text-xs mb-3">
              <div className="flex justify-between font-bold text-slate-950">
                <span>{exp.company}</span>
                <span>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <p className="italic text-slate-800 mb-1">{exp.role} {exp.location && `| ${exp.location}`}</p>
              {hasItems(exp.bullets) && (
                <ul className="list-disc pl-5 space-y-0.5 text-slate-800">
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {hasItems(projects) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Technical Projects
          </h2>
          {projects.map((p) => (
            <div key={p.id} className="print-avoid-break text-xs mb-2.5">
              <div className="flex justify-between font-bold text-slate-950">
                <span>{p.title}</span>
                {hasItems(p.technologies) && (
                  <span className="font-normal italic text-slate-600">{p.technologies.join(", ")}</span>
                )}
              </div>
              {hasItems(p.bullets) && (
                <ul className="list-disc pl-5 space-y-0.5 text-slate-800 mt-0.5">
                  {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills && (hasItems(skills.languages) || hasItems(skills.frameworks) || hasItems(skills.tools)) && (
        <section className="mb-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
            Skills & Competencies
          </h2>
          <p><span className="font-bold">Languages & Technologies: </span>{(skills.languages || []).concat(skills.frameworks || []).join(", ")}</p>
          <p><span className="font-bold">Developer Tools: </span>{(skills.tools || []).join(", ")}</p>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// 3. MINIMALIST CLEAN TEMPLATE (Maximum ATS Density)
// ============================================================================
function MinimalTemplate({ resume }: { resume: Resume }) {
  const { personalInfo, education, skills, experience, projects, summary } = resume;

  return (
    <div
      id="resume-printable-document"
      className="w-full bg-white text-black p-8 sm:p-10 shadow-xl rounded-xl border border-slate-200 font-sans leading-tight print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
    >
      <header className="border-b border-black pb-3 mb-4">
        <h1 className="text-2xl font-black tracking-tight uppercase text-black">{personalInfo.fullName}</h1>
        <p className="text-xs text-neutral-800 mt-1">
          {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.linkedin, personalInfo.github]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </header>

      {summary && (
        <div className="mb-3 text-xs text-neutral-900 text-justify">
          <p>{summary}</p>
        </div>
      )}

      {/* Technical Skills */}
      {skills && (
        <section className="mb-3 text-xs">
          <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1">Technical Skills</h2>
          {hasItems(skills.languages) && <p><span className="font-bold">Languages: </span>{skills.languages.join(", ")}</p>}
          {hasItems(skills.frameworks) && <p><span className="font-bold">Frameworks: </span>{skills.frameworks.join(", ")}</p>}
          {hasItems(skills.tools) && <p><span className="font-bold">Tools: </span>{skills.tools.join(", ")}</p>}
        </section>
      )}

      {/* Experience */}
      {hasItems(experience) && (
        <section className="mb-3 text-xs">
          <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">Experience</h2>
          {experience.map((e) => (
            <div key={e.id} className="print-avoid-break mb-2">
              <div className="flex justify-between font-bold">
                <span>{e.role} — {e.company}</span>
                <span>{e.startDate} – {e.endDate}</span>
              </div>
              {hasItems(e.bullets) && (
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {hasItems(projects) && (
        <section className="mb-3 text-xs">
          <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">Projects</h2>
          {projects.map((p) => (
            <div key={p.id} className="print-avoid-break mb-2">
              <div className="flex justify-between font-bold">
                <span>{p.title} {hasItems(p.technologies) && `(${p.technologies.join(", ")})`}</span>
                {p.link && <span className="font-normal underline">{p.link}</span>}
              </div>
              {hasItems(p.bullets) && (
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  {p.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {hasItems(education) && (
        <section className="mb-3 text-xs">
          <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="print-avoid-break flex justify-between mb-1">
              <span><strong>{edu.institution}</strong> — {edu.degree} in {edu.fieldOfStudy}</span>
              <span>{edu.startDate} – {edu.endDate}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
