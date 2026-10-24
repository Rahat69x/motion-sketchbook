import { Resume, ATSAnalysis, ATSFormattingCheck } from "./types";

// Standard technical and placement skill dictionary for keyword extraction
const CORE_KEYWORDS_DICTIONARY = [
  // Languages
  "typescript", "javascript", "python", "java", "c++", "c#", "golang", "rust", "sql", "html5", "css3", "bash",
  // Frontend
  "react", "next.js", "vue.js", "angular", "tailwind css", "redux", "graphql", "responsive design", "webpack", "vite", "web accessibility", "dom",
  // Backend & Cloud
  "node.js", "express", "nestjs", "django", "fastapi", "spring boot", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes", "aws", "gcp", "azure", "microservices", "rest api", "ci/cd", "git",
  // Concepts & Data
  "data structures", "algorithms", "object-oriented programming", "system design", "unit testing", "jest", "postman", "agile", "scrum", "machine learning", "pandas", "numpy", "power bi", "tableau", "cybersecurity"
];

// Action verbs that indicate strong bullet points
const STRONG_ACTION_VERBS = [
  "architected", "engineered", "developed", "implemented", "optimized", "spearheaded", "orchestrated",
  "reduced", "increased", "designed", "automated", "streamlined", "deployed", "scaled", "collaborated"
];

// Vague buzzwords to caution against
const VAGUE_BUZZWORDS = [
  "hardworking", "passionate", "detail-oriented", "team player", "quick learner", "self-starter", "results-driven"
];

export function analyzeResumeForJob(
  resume: Resume | null,
  rawResumeText: string,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  userId: string
): ATSAnalysis {
  // Aggregate all textual content from resume
  let fullResumeText = rawResumeText || "";

  if (resume) {
    const parts = [
      resume.personalInfo.fullName,
      resume.personalInfo.email,
      resume.personalInfo.phone,
      resume.personalInfo.location,
      resume.personalInfo.summary,
      ...(resume.education || []).map((e) => `${e.degree} ${e.fieldOfStudy} ${e.institution} ${e.highlights || ""}`),
      ...(resume.skills.technical || []),
      ...(resume.skills.languages || []),
      ...(resume.skills.frameworks || []),
      ...(resume.skills.tools || []),
      ...(resume.skills.soft || []),
      ...(resume.skills.concepts || []),
      ...(resume.experience || []).map((e) => `${e.role} ${e.company} ${(e.bullets || []).join(" ")}`),
      ...(resume.projects || []).map((p) => `${p.title} ${(p.techStack || p.technologies || []).join(" ")} ${p.description || ""} ${(p.bullets || []).join(" ")}`),
      ...(resume.certifications || []).map((c) => `${c.name} ${c.issuer}`),
      ...(resume.achievements || []).map((a) => `${a.title} ${a.description || ""}`),
    ];
    fullResumeText = `${fullResumeText} ${parts.join(" ")}`;
  }

  const resumeLower = fullResumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // 1. Detect keywords present in Job Description
  const detectedInJD: string[] = [];
  CORE_KEYWORDS_DICTIONARY.forEach((kw) => {
    // Regex word boundary matching
    const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (regex.test(jdLower)) {
      detectedInJD.push(kw);
    }
  });

  // Also extract explicit capitalized or highlighted terms from JD
  const customWords = jobDescription.match(/\b[A-Z][a-zA-Z0-9+#.-]{1,18}\b/g) || [];
  customWords.forEach((w) => {
    const lw = w.toLowerCase();
    if (
      lw.length > 2 &&
      !["and", "for", "with", "the", "you", "our", "are", "will", "this", "that", "have", "from", "team", "work"].includes(lw) &&
      !detectedInJD.includes(lw)
    ) {
      if (CORE_KEYWORDS_DICTIONARY.includes(lw)) {
        detectedInJD.push(lw);
      }
    }
  });

  // Ensure unique list
  const uniqueJDKeywords = Array.from(new Set(detectedInJD));

  // 2. Compute keyword matching against Resume
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  uniqueJDKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (regex.test(resumeLower)) {
      matchedKeywords.push(capitalizeKeyword(kw));
    } else {
      missingKeywords.push(capitalizeKeyword(kw));
    }
  });

  // 3. Formatting & Structural Checks
  const formattingChecks: ATSFormattingCheck[] = [];

  // Contact Info Check
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(fullResumeText);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(fullResumeText);
  formattingChecks.push({
    check: "Contact Details Clarity",
    passed: hasEmail && hasPhone,
    message: hasEmail && hasPhone
      ? "Professional email address and phone number detected clearly."
      : "Missing explicit email address or standard phone number format.",
    severity: "high",
  });

  // Section Headers
  const hasEducation = /education|academic|bachelor|degree/i.test(resumeLower);
  const hasSkills = /skills|technical|technologies|proficiencies/i.test(resumeLower);
  const hasProjectsOrExp = /experience|projects|internship|work/i.test(resumeLower);
  const headersPassed = hasEducation && hasSkills && hasProjectsOrExp;
  formattingChecks.push({
    check: "Standard Section Headings",
    passed: headersPassed,
    message: headersPassed
      ? "Standard parsed headers (Education, Skills, Experience/Projects) found."
      : "Ensure standard section titles ('Education', 'Skills', 'Projects') are clearly labeled.",
    severity: "high",
  });

  // Action Verbs
  let actionVerbCount = 0;
  STRONG_ACTION_VERBS.forEach((v) => {
    if (new RegExp(`\\b${v}\\b`, "i").test(resumeLower)) actionVerbCount++;
  });
  formattingChecks.push({
    check: "Action Verb Punchiness",
    passed: actionVerbCount >= 4,
    message: actionVerbCount >= 4
      ? `Strong achievement-oriented action verbs detected (${actionVerbCount} unique action verbs).`
      : `Found only ${actionVerbCount} dynamic action verbs. Start bullet points with strong past-tense verbs (e.g., 'Engineered', 'Optimized', 'Architected').`,
    severity: "medium",
  });

  // Metrics & Numbers Check (Quantifiable impact)
  const numbersFound = (fullResumeText.match(/\b\d+(\.\d+)?%?(\s*(ms|s|hours|users|requests|k|m))?\b/gi) || []).length;
  formattingChecks.push({
    check: "Quantifiable Metrics & Accomplishments",
    passed: numbersFound >= 3,
    message: numbersFound >= 3
      ? `Good presence of quantifiable data points and metrics (${numbersFound} numeric metrics detected).`
      : "ATS and recruiters favor measurable results (e.g., 'reduced load time by 30%', 'handled 5,000 daily queries').",
    severity: "medium",
  });

  // Vague buzzwords check
  const foundBuzzwords = VAGUE_BUZZWORDS.filter((bw) => new RegExp(`\\b${bw}\\b`, "i").test(resumeLower));
  formattingChecks.push({
    check: "Objective Tone & Buzzword Avoidance",
    passed: foundBuzzwords.length <= 1,
    message: foundBuzzwords.length <= 1
      ? "Resume maintains an objective, technical tone without fluff."
      : `Replace subjective cliches (${foundBuzzwords.map((b) => `'${b}'`).join(", ")}) with concrete technical accomplishments.`,
    severity: "low",
  });

  // Summary length check
  const summaryLength = resume?.personalInfo.summary?.split(/\s+/).length || 0;
  const summaryGood = summaryLength === 0 || (summaryLength >= 25 && summaryLength <= 85);
  formattingChecks.push({
    check: "Professional Summary Length",
    passed: summaryGood,
    message: summaryGood
      ? "Professional summary is concise, focused, and within the optimal 2-4 sentence range."
      : `Summary is currently ${summaryLength} words. Aim for 30 to 70 words focusing directly on target role and core stack.`,
    severity: "low",
  });

  // 4. Score Calculation (Weighted, Documented, Explainable)
  const totalKeywords = Math.max(1, uniqueJDKeywords.length);
  const keywordRatio = Math.min(1.0, matchedKeywords.length / totalKeywords);
  const keywordScore = Math.round(keywordRatio * 100);

  const skillsScore = Math.min(100, Math.round((matchedKeywords.length / Math.max(3, uniqueJDKeywords.length * 0.75)) * 100));
  const formattingPassedCount = formattingChecks.filter((c) => c.passed).length;
  const formattingScore = Math.round((formattingPassedCount / formattingChecks.length) * 100);

  // Experience relevance based on role title match and bullet density
  const roleKeywords = jobTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matchedRoleKws = roleKeywords.filter((w) => resumeLower.includes(w)).length;
  const expRelevance = Math.min(100, Math.round(50 + (matchedRoleKws / Math.max(1, roleKeywords.length)) * 40 + (numbersFound > 3 ? 10 : 0)));

  // Weighted overall calculation: 40% Keyword Match + 25% Skills Coverage + 20% Experience Relevance + 15% Formatting
  const overallScore = Math.round(
    keywordScore * 0.40 +
    skillsScore * 0.25 +
    expRelevance * 0.20 +
    formattingScore * 0.15
  );

  // 5. Generate Actionable Recommendations
  const recommendations: string[] = [];

  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 5);
    recommendations.push(
      `Incorporate key target skills from the job description: ${topMissing.join(", ")}. Weave them naturally into your projects or technical skills section.`
    );
  }

  if (numbersFound < 3) {
    recommendations.push(
      "Strengthen impact by adding quantifiable measurements to your project bullets (e.g. latency reduced, user counts, test coverage %)."
    );
  }

  if (actionVerbCount < 4) {
    recommendations.push(
      "Replace passive descriptions (e.g., 'Responsible for...') with authoritative action verbs like 'Engineered', 'Architected', or 'Automated'."
    );
  }

  if (foundBuzzwords.length > 0) {
    recommendations.push(
      `Remove generic filler words (${foundBuzzwords.join(", ")}) and let your technical stack and project outcomes speak for your qualifications.`
    );
  }

  if (!hasEmail || !hasPhone) {
    recommendations.push(
      "Verify that contact information (professional email, mobile phone, LinkedIn) is placed prominently at the very top of the resume."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Your resume aligns exceptionally well with the target job description! Ensure all project repository URLs and portfolio links are active."
    );
  }

  return {
    id: `ats_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    resumeId: resume?.id || null,
    resumeTitle: resume?.title || "Uploaded / Custom Resume Text",
    jobTitle: jobTitle || "Target Position",
    jobCompany: jobCompany || "Target Employer",
    jobDescription,
    overallScore,
    score: overallScore,
    scoreBreakdown: {
      keywordMatch: keywordScore,
      skillsCoverage: skillsScore,
      experienceRelevance: expRelevance,
      formattingQuality: formattingScore,
    },
    detectedKeywords: uniqueJDKeywords.map(capitalizeKeyword),
    matchedKeywords,
    missingKeywords,
    formattingChecks,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}

function capitalizeKeyword(kw: string): string {
  if (kw.length <= 3) return kw.toUpperCase();
  if (kw.includes(".")) return kw.toUpperCase();
  return kw
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
