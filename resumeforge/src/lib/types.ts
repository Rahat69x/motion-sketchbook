export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
  gradYear?: string;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  university: string;
  degree: string;
  graduationYear: number;
  targetRole: string;
}

export interface ResumePersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio?: string;
  website?: string;
  summary?: string;
  title?: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  highlights?: any;
}

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
}

export interface ResumeProject {
  id: string;
  title: string;
  role?: string;
  techStack?: string[];
  technologies?: string[];
  liveUrl?: string;
  githubUrl?: string;
  link?: string;
  description?: string;
  bullets: string[];
}

export interface ResumeSkillCategory {
  technical?: string[];
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  soft?: string[];
  concepts?: string[];
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  url?: string;
}

export interface ResumeAchievement {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface ResumeLanguage {
  id: string;
  language: string;
  proficiency: "Native" | "Fluent" | "Professional" | "Intermediate" | "Basic";
}

export type ResumeTemplate = "modern" | "classic" | "minimal";

export interface Resume {
  id: string;
  userId: string;
  title: string;
  template: ResumeTemplate;
  personalInfo: ResumePersonalInfo;
  education: ResumeEducation[];
  skills: ResumeSkillCategory;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  achievements: ResumeAchievement[];
  languages: ResumeLanguage[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// Convenient aliases for components
export type Education = ResumeEducation;
export type Experience = ResumeExperience;
export type Project = ResumeProject;
export type Certification = ResumeCertification;
export type Achievement = ResumeAchievement;
export type Language = ResumeLanguage;

export interface ATSFormattingCheck {
  check: string;
  passed: boolean;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface ATSAnalysis {
  id: string;
  userId: string;
  resumeId: string | null;
  resumeTitle?: string;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription?: string;
  overallScore?: number;
  score?: number;
  scoreBreakdown?: {
    keywordMatch: number;
    skillsCoverage: number;
    experienceRelevance: number;
    formattingQuality: number;
  };
  breakdown?: {
    keywordScore: number;
    formatScore: number;
    sectionScore: number;
    verbsScore: number;
  };
  detectedKeywords?: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingChecks?: ATSFormattingCheck[];
  formattingRisks?: string[];
  recommendations: string[];
  createdAt: string;
}

export type InterviewCategory = "hr" | "behavioral" | "technical" | "system-design" | "general";
export type InterviewDifficulty = "easy" | "medium" | "hard" | "junior" | "mid" | "senior";

export interface InterviewQuestionItem {
  id: string;
  questionText?: string;
  question?: string;
  category: InterviewCategory;
  expectedConcepts?: string[];
  timeLimitSeconds?: number;
  userAnswer?: string;
  timeSpentSeconds?: number;
  score?: number;
  difficulty?: InterviewDifficulty;
  modelAnswer?: string;
  rubricFeedback?: {
    relevanceScore: number;
    clarityScore: number;
    technicalDepthScore: number;
    starAdherence?: {
      situation: boolean;
      task: boolean;
      action: boolean;
      result: boolean;
    };
    critique: string;
    modelAnswerSnippet: string;
    actionableTip: string;
  };
}

export type InterviewQuestion = InterviewQuestionItem;

export interface InterviewAnswer {
  questionId: string;
  userAnswer: string;
  score?: number;
  feedback?: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  category: InterviewCategory;
  targetRole: string;
  difficulty: InterviewDifficulty;
  status: "in_progress" | "completed" | "abandoned";
  overallScore?: number;
  feedbackSummary?: string;
  feedback?: {
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  questions: InterviewQuestionItem[];
  answers?: InterviewAnswer[];
  createdAt: string;
  completedAt: string | null;
}

export type AptitudeCategory = "quantitative" | "logical" | "verbal" | "data-interpretation";

export interface AptitudeQuestion {
  id: string;
  category: AptitudeCategory;
  subtopic?: string;
  difficulty: "easy" | "medium" | "hard";
  questionText?: string;
  question?: string;
  options: any; // Can be string[] or { A: string, B: string, C: string, D: string }
  correctOption?: any;
  explanation?: string;
  recommendedTimeSeconds?: number;
}

export interface AptitudeUserResponse {
  questionId: string;
  selectedOption: any;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}

export interface AptitudeAttempt {
  id: string;
  userId: string;
  category?: AptitudeCategory | "all" | string;
  mode?: "practice" | "timed";
  totalQuestions: number;
  correctAnswers?: number;
  score?: number;
  accuracy: number;
  timeSpentSeconds: number;
  responses?: AptitudeUserResponse[];
  answers?: any[];
  completedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalResumes: number;
  interviewSessionsCount: number;
  interviewAvgScore: number;
  aptitudeTestsCount: number;
  aptitudeAccuracy: number;
  atsChecksCount: number;
  recentActivity: Array<{
    id: string;
    type: "resume" | "ats" | "interview" | "aptitude";
    title: string;
    subtitle: string;
    timestamp: string;
    link: string;
  }>;
}
