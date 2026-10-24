import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  User,
  Resume,
  ATSAnalysis,
  InterviewSession,
  AptitudeQuestion,
  AptitudeAttempt,
  DashboardStats,
} from "./types";

interface DatabaseSchema {
  users: User[];
  resumes: Resume[];
  atsAnalyses: ATSAnalysis[];
  interviewSessions: InterviewSession[];
  aptitudeQuestions: AptitudeQuestion[];
  aptitudeAttempts: AptitudeAttempt[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "resumeforge.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial seed data
function getInitialSeedData(): DatabaseSchema {
  // Pre-hashed password for "Placement2026!"
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync("Placement2026!", salt);

  const demoUserId = "usr_demo_student_01";

  const seedUsers: User[] = [
    {
      id: demoUserId,
      name: "Alex Rivera",
      email: "student@resumeforge.edu",
      passwordHash: demoPasswordHash,
      university: "National Institute of Technology",
      degree: "B.Tech in Computer Science & Engineering",
      graduationYear: 2026,
      targetRole: "Full-Stack Software Engineer",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const seedResumes: Resume[] = [
    {
      id: "res_fullstack_2026",
      userId: demoUserId,
      title: "Full-Stack Software Engineer (Campus 2026)",
      template: "modern",
      personalInfo: {
        fullName: "Alex Rivera",
        email: "alex.rivera@resumeforge.edu",
        phone: "+1 (555) 234-5678",
        location: "San Jose, CA (Open to Relocation)",
        linkedin: "linkedin.com/in/alex-rivera-tech",
        github: "github.com/alexrivera-dev",
        portfolio: "alexrivera.dev",
        summary:
          "High-impact Computer Science undergraduate with hands-on experience building scalable web applications in React, TypeScript, Node.js, and PostgreSQL. Proven ability to design RESTful architectures, optimize database queries by 35%, and ship production-ready features across 4 full-stack projects.",
      },
      education: [
        {
          id: "edu_1",
          institution: "National Institute of Technology",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science & Engineering",
          startDate: "Aug 2022",
          endDate: "May 2026",
          gpa: "3.85 / 4.0",
          highlights:
            "Dean's Honor List (4 semesters), Coursework: Data Structures & Algorithms, Database Systems, Computer Networks, Distributed Systems, Operating Systems",
        },
      ],
      skills: {
        technical: ["TypeScript", "JavaScript (ES6+)", "Python", "SQL", "C++", "HTML5", "CSS3"],
        frameworks: ["React.js", "Next.js", "Node.js", "Express.js", "Tailwind CSS", "Prisma ORM"],
        tools: ["Git & GitHub", "Docker", "PostgreSQL", "MongoDB", "Redis", "Jest", "Postman", "Linux/Bash"],
        soft: ["Agile/Scrum Workflow", "Technical Communication", "Cross-Functional Collaboration", "System Design Fundamentals"],
      },
      experience: [
        {
          id: "exp_1",
          company: "Nexus Labs",
          role: "Software Engineering Intern",
          location: "Remote / San Jose, CA",
          startDate: "Jun 2024",
          endDate: "Aug 2024",
          current: false,
          bullets: [
            "Engineered responsive user dashboard using Next.js, TypeScript, and Tailwind CSS, improving page load speed by 28% and Lighthouse score to 98.",
            "Designed and implemented 8 authenticated REST API endpoints with Express and PostgreSQL, handling over 12,000 daily requests with sub-120ms latency.",
            "Collaborated with 4 senior engineers in bi-weekly sprints, participating in code reviews, automated unit testing with Jest, and CI/CD deployment pipelines.",
          ],
        },
      ],
      projects: [
        {
          id: "proj_1",
          title: "CloudVault — Distributed Real-Time Collaboration Canvas",
          role: "Lead Full-Stack Developer",
          techStack: ["Next.js", "TypeScript", "WebSocket", "Tailwind CSS", "Redis"],
          liveUrl: "https://cloudvault-demo.app",
          githubUrl: "https://github.com/alexrivera-dev/cloudvault",
          description: "High-throughput collaborative workspace supporting simultaneous multi-cursor drawing and instant state synchronization.",
          bullets: [
            "Architected WebSocket synchronization engine with Redis pub/sub backplane, supporting up to 50 concurrent editors per room with <40ms ping.",
            "Implemented optimistic UI rendering and conflict-resolution algorithms for smooth canvas interactions across high-latency connections.",
            "Wrote comprehensive unit and integration test suite covering 88% of core business logic.",
          ],
        },
        {
          id: "proj_2",
          title: "DevMetrics — Developer Productivity & GitHub Analytics Engine",
          role: "Full-Stack Creator",
          techStack: ["React", "Node.js", "PostgreSQL", "Chart.js", "GitHub REST API"],
          liveUrl: "https://devmetrics-demo.app",
          githubUrl: "https://github.com/alexrivera-dev/devmetrics",
          description: "Automated telemetry dashboard analyzing commit velocity, pull request cycles, and code review turnarounds.",
          bullets: [
            "Integrated GitHub GraphQL and REST APIs with secure OAuth2 token rotation to extract repository activity metrics for 150+ users.",
            "Designed PostgreSQL relational schema with compound indexing, reducing analytics query execution times from 420ms to 68ms.",
          ],
        },
      ],
      certifications: [
        {
          id: "cert_1",
          name: "AWS Certified Cloud Practitioner",
          issuer: "Amazon Web Services (AWS)",
          issueDate: "Jan 2024",
          url: "https://aws.amazon.com/verification",
        },
        {
          id: "cert_2",
          name: "Meta Front-End Developer Specialization",
          issuer: "Meta / Coursera",
          issueDate: "Sep 2023",
          url: "https://coursera.org/verify",
        },
      ],
      achievements: [
        {
          id: "ach_1",
          title: "1st Place Winner — HackNation 2024",
          issuer: "TechCon Global",
          date: "Mar 2024",
          description: "Built an AI-assisted accessibility reader in 36 hours competing against 120 collegiate teams.",
        },
        {
          id: "ach_2",
          title: "LeetCode 350+ Problems Solved",
          issuer: "LeetCode",
          date: "Ongoing",
          description: "Top 8% globally in algorithm contest ratings; strong proficiency in graphs, dynamic programming, and binary search.",
        },
      ],
      languages: [
        { id: "lang_1", language: "English", proficiency: "Fluent" },
        { id: "lang_2", language: "Spanish", proficiency: "Professional" },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const seedATS: ATSAnalysis[] = [
    {
      id: "ats_sample_01",
      userId: demoUserId,
      resumeId: "res_fullstack_2026",
      resumeTitle: "Full-Stack Software Engineer (Campus 2026)",
      jobTitle: "Junior Full-Stack Engineer",
      jobCompany: "Stripe",
      jobDescription:
        "We are looking for a Junior Full-Stack Software Engineer with strong skills in TypeScript, React, Node.js, and PostgreSQL. Experience with Docker, REST APIs, Git workflows, unit testing with Jest, and cloud services (AWS) is highly desired. Strong problem-solving skills, algorithmic foundation, and clean code principles are required.",
      overallScore: 88,
      score: 88,
      scoreBreakdown: {
        keywordMatch: 92,
        skillsCoverage: 88,
        experienceRelevance: 84,
        formattingQuality: 90,
      },
      detectedKeywords: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "REST APIs", "Git", "Jest", "AWS", "SQL", "Tailwind CSS"],
      matchedKeywords: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "REST APIs", "Git", "Jest", "AWS", "SQL"],
      missingKeywords: ["CI/CD Pipelines", "GraphQL", "Microservices Architecture"],
      formattingChecks: [
        { check: "Contact Information Completeness", passed: true, message: "Email, phone number, location, and LinkedIn URL are present and easily readable.", severity: "low" },
        { check: "Standard Section Headers", passed: true, message: "Standard headers ('Education', 'Experience', 'Projects', 'Skills') parsed cleanly.", severity: "low" },
        { check: "Measurable Impact & Metrics", passed: true, message: "Strong quantifiable accomplishments detected (e.g., '28% speed improvement', '12,000 requests', '35% database optimization').", severity: "low" },
        { check: "Complex Table / Multi-column Layout Risks", passed: true, message: "Single-column linear semantic hierarchy minimizes ATS parsing failure risk.", severity: "low" },
      ],
      recommendations: [
        "Include 1-2 bullet points highlighting experience with CI/CD deployment automation (e.g. GitHub Actions).",
        "Consider mentioning GraphQL or microservice communication paradigms in the project section to strengthen full-stack coverage.",
        "Ensure your GitHub links are hyperlinked with clear descriptive text in the final export.",
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ];

  const seedInterviews: InterviewSession[] = [
    {
      id: "int_sample_01",
      userId: demoUserId,
      category: "behavioral",
      targetRole: "Software Engineer",
      difficulty: "junior",
      status: "completed",
      overallScore: 84,
      feedbackSummary: "Excellent adherence to the STAR framework (Situation, Task, Action, Result). Clear technical communication and honest articulation of trade-offs made during team projects.",
      questions: [
        {
          id: "q_beh_01",
          questionText: "Tell me about a time when you had to resolve a difficult technical bug under a tight deadline.",
          category: "behavioral",
          expectedConcepts: ["Root cause analysis", "Systematic debugging", "Communication with stakeholders", "Measurable resolution", "Post-mortem / prevention"],
          userAnswer:
            "During our 36-hour hackathon, our team's WebSocket server crashed randomly under simulated load 4 hours before judging (Situation). My task was to identify the root cause without disrupting frontend progress (Task). I used Node.js memory profiling and discovered unclosed event listeners on connection disconnects leaking memory. I refactored the listener teardown and added an exponential backoff reconnect handler (Action). As a result, the server sustained 200 concurrent connections seamlessly throughout the live demo, and our team won 1st place (Result).",
          score: 88,
          rubricFeedback: {
            relevanceScore: 92,
            clarityScore: 86,
            technicalDepthScore: 86,
            starAdherence: { situation: true, task: true, action: true, result: true },
            critique: "Superb structured delivery with clear technical specificity (memory profiling, event listener cleanup). Quantifiable outcome reinforces credibility.",
            modelAnswerSnippet: "Focus on isolating variables, systematic profiling, transparent updates to teammates, and introducing preventative unit tests.",
            actionableTip: "Mention briefly how you documented the fix or added automated tests to prevent regressions in future releases.",
          },
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 18).toISOString(),
    },
  ];

  const seedAptitudeAttempts: AptitudeAttempt[] = [
    {
      id: "apt_attempt_01",
      userId: demoUserId,
      category: "quantitative",
      mode: "timed",
      totalQuestions: 10,
      correctAnswers: 9,
      accuracy: 90,
      timeSpentSeconds: 480,
      responses: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    },
  ];

  return {
    users: seedUsers,
    resumes: seedResumes,
    atsAnalyses: seedATS,
    interviewSessions: seedInterviews,
    aptitudeQuestions: getAptitudeSeedQuestions(),
    aptitudeAttempts: seedAptitudeAttempts,
  };
}

// 40+ curated placement aptitude questions
function getAptitudeSeedQuestions(): AptitudeQuestion[] {
  return [
    // --- Quantitative Aptitude ---
    {
      id: "quant_01",
      category: "quantitative",
      subtopic: "Percentages & Ratios",
      difficulty: "easy",
      questionText: "If the price of a commodity increases by 25%, by what percentage must a household reduce its consumption so that the total expenditure remains constant?",
      options: { A: "20%", B: "25%", C: "16.67%", D: "33.33%" },
      correctOption: "A",
      explanation: "Let original price = 100 and consumption = 100. Original Expenditure = 100 × 100 = 10,000. New price = 125. To keep expenditure at 10,000, new consumption = 10,000 / 125 = 80. Reduction = 100 - 80 = 20%. Alternatively, using formula: (R / (100 + R)) × 100% = (25 / 125) × 100% = 20%.",
      recommendedTimeSeconds: 45,
    },
    {
      id: "quant_02",
      category: "quantitative",
      subtopic: "Time & Work",
      difficulty: "medium",
      questionText: "Pipe A can fill a tank in 12 hours, and Pipe B can fill it in 18 hours. If both pipes are opened together, how long will it take to fill the tank completely?",
      options: { A: "6.5 hours", B: "7.2 hours", C: "8.0 hours", D: "9.0 hours" },
      correctOption: "B",
      explanation: "Rate of A = 1/12 per hour. Rate of B = 1/18 per hour. Combined rate = (1/12) + (1/18) = (3 + 2)/36 = 5/36 per hour. Time taken = 36 / 5 = 7.2 hours (or 7 hours 12 minutes).",
      recommendedTimeSeconds: 60,
    },
    {
      id: "quant_03",
      category: "quantitative",
      subtopic: "Speed, Distance & Time",
      difficulty: "medium",
      questionText: "A train traveling at 72 km/h crosses a 180-meter-long platform in 18 seconds. What is the length of the train in meters?",
      options: { A: "160 m", B: "180 m", C: "200 m", D: "220 m" },
      correctOption: "B",
      explanation: "Speed in m/s = 72 × (5/18) = 20 m/s. Total distance crossed in 18 seconds = 20 m/s × 18 s = 360 meters. Total distance = Length of train (L) + Length of platform (180 m). L + 180 = 360 => L = 180 meters.",
      recommendedTimeSeconds: 50,
    },
    {
      id: "quant_04",
      category: "quantitative",
      subtopic: "Profit & Loss",
      difficulty: "medium",
      questionText: "An article is sold at a profit of 20%. If both the cost price and selling price were $50 less, the profit would have been 25%. What is the original cost price?",
      options: { A: "$250", B: "$300", C: "$350", D: "$400" },
      correctOption: "A",
      explanation: "Let CP = x, SP = 1.20x. New CP = x - 50, New SP = 1.20x - 50. New Profit = 25%, so New SP = 1.25 × (New CP). 1.20x - 50 = 1.25(x - 50) => 1.20x - 50 = 1.25x - 62.5 => 0.05x = 12.5 => x = $250.",
      recommendedTimeSeconds: 75,
    },
    {
      id: "quant_05",
      category: "quantitative",
      subtopic: "Permutations & Combinations",
      difficulty: "hard",
      questionText: "In how many distinct ways can the letters of the word 'CAMPUS' be arranged such that all the vowels always stay together?",
      options: { A: "120", B: "240", C: "720", D: "1440" },
      correctOption: "B",
      explanation: "The word CAMPUS contains 6 letters: vowels = {A, U} (2 vowels), consonants = {C, M, P, S} (4 consonants). Treat the 2 vowels as a single entity: (AU). We now arrange 5 entities {C, M, P, S, (AU)} in 5! = 120 ways. Within the entity, the 2 vowels can be arranged in 2! = 2 ways. Total arrangements = 120 × 2 = 240 ways.",
      recommendedTimeSeconds: 60,
    },
    {
      id: "quant_06",
      category: "quantitative",
      subtopic: "Probability",
      difficulty: "medium",
      questionText: "Two fair six-sided dice are rolled simultaneously. What is the probability that the sum of the two faces is at least 9?",
      options: { A: "5/18", B: "1/4", C: "7/36", D: "1/3" },
      correctOption: "A",
      explanation: "Total outcomes = 6 × 6 = 36. Favorable outcomes where sum ≥ 9: Sum 9: (3,6), (4,5), (5,4), (6,3) [4 outcomes]. Sum 10: (4,6), (5,5), (6,4) [3 outcomes]. Sum 11: (5,6), (6,5) [2 outcomes]. Sum 12: (6,6) [1 outcome]. Total favorable = 4 + 3 + 2 + 1 = 10 outcomes. Probability = 10 / 36 = 5 / 18.",
      recommendedTimeSeconds: 50,
    },

    // --- Logical Reasoning ---
    {
      id: "log_01",
      category: "logical",
      subtopic: "Number Series",
      difficulty: "easy",
      questionText: "Find the next number in the sequence: 4, 9, 19, 39, 79, ?",
      options: { A: "149", B: "159", C: "169", D: "179" },
      correctOption: "B",
      explanation: "Pattern: Each number is multiplied by 2 and then incremented by 1. 4×2+1=9, 9×2+1=19, 19×2+1=39, 39×2+1=79. Next number = 79×2 + 1 = 158 + 1 = 159.",
      recommendedTimeSeconds: 35,
    },
    {
      id: "log_02",
      category: "logical",
      subtopic: "Blood Relations",
      difficulty: "medium",
      questionText: "Pointing to a photograph, a woman says: 'He is the only son of the mother of my father's only daughter.' How is the man in the photograph related to the woman?",
      options: { A: "Father", B: "Brother", C: "Uncle", D: "Cousin" },
      correctOption: "B",
      explanation: "Let us break it down from the woman's perspective: 'my father's only daughter' = the woman herself (since she is female and her father's only daughter). 'the mother of my father's only daughter' = the woman's mother. 'the only son of [her mother]' = the woman's brother. Therefore, the man is her brother.",
      recommendedTimeSeconds: 45,
    },
    {
      id: "log_03",
      category: "logical",
      subtopic: "Syllogisms",
      difficulty: "medium",
      questionText: "Statements: 1. All engineers are problem solvers. 2. Some problem solvers are programmers. Conclusions: I. Some engineers are programmers. II. Some problem solvers are engineers. Which conclusion(s) logically follow?",
      options: { A: "Only I follows", B: "Only II follows", C: "Both I and II follow", D: "Neither follows" },
      correctOption: "B",
      explanation: "Statement 1: All engineers ⊆ Problem solvers. Therefore, the intersection between Engineers and Problem Solvers is non-empty, which directly implies 'Some problem solvers are engineers' (Conclusion II is valid). However, programmers only intersect with 'problem solvers', which may or may not overlap with the subset of 'engineers' (Conclusion I is not guaranteed). Only Conclusion II follows.",
      recommendedTimeSeconds: 45,
    },
    {
      id: "log_04",
      category: "logical",
      subtopic: "Coding-Decoding",
      difficulty: "easy",
      questionText: "If in a certain code language, 'REACT' is coded as 'TGCEX', how will 'NODE' be coded in that same system?",
      options: { A: "PQFG", B: "PQFH", C: "OPEF", D: "PQEG" },
      correctOption: "A",
      explanation: "Each letter is shifted forward by 2 positions in alphabetical order: R (+2) -> T, E (+2) -> G, A (+2) -> C, C (+2) -> E, T (+2) -> V (error check: T+2=V, here offset +2). For NODE: N (+2) = P, O (+2) = Q, D (+2) = F, E (+2) = G. Code = PQFG.",
      recommendedTimeSeconds: 30,
    },
    {
      id: "log_05",
      category: "logical",
      subtopic: "Seating Arrangements",
      difficulty: "hard",
      questionText: "Five friends (P, Q, R, S, T) sit in a straight line facing North. Q is to the immediate right of S. P sits between T and S. R is at the extreme right end. Who sits in the exact middle?",
      options: { A: "P", B: "S", C: "Q", D: "T" },
      correctOption: "B",
      explanation: "Line has 5 positions: [1, 2, 3, 4, 5]. R is at extreme right (pos 5). Q is immediate right of S -> [S, Q]. P is between T and S -> [T, P, S]. Combining them: T - P - S - Q - R. Positions: 1: T, 2: P, 3: S, 4: Q, 5: R. Middle position (3) is S.",
      recommendedTimeSeconds: 60,
    },

    // --- Verbal Ability ---
    {
      id: "verb_01",
      category: "verbal",
      subtopic: "Sentence Correction",
      difficulty: "easy",
      questionText: "Identify the grammatically correct sentence:",
      options: {
        A: "Neither the manager nor the employees was available for comment.",
        B: "Neither the manager nor the employees were available for comment.",
        C: "Neither the manager or the employees were available for comment.",
        D: "Neither the manager nor the employees has been available for comment."
      },
      correctOption: "B",
      explanation: "In 'Neither... nor' constructions, the verb agrees with the subject closest to it. Here, 'employees' is plural and adjacent to the verb, so the plural verb 'were' is grammatically correct.",
      recommendedTimeSeconds: 35,
    },
    {
      id: "verb_02",
      category: "verbal",
      subtopic: "Synonyms & Vocabulary",
      difficulty: "medium",
      questionText: "Choose the word most nearly opposite in meaning (antonym) to 'EPHEMERAL':",
      options: { A: "Fleeting", B: "Permanent", C: "Transient", D: "Lucid" },
      correctOption: "B",
      explanation: "'Ephemeral' means lasting for a very short time; transient or momentary. Its exact antonym is 'Permanent' (lasting or intended to last indefinitely).",
      recommendedTimeSeconds: 25,
    },
    {
      id: "verb_03",
      category: "verbal",
      subtopic: "Idioms & Phrases",
      difficulty: "easy",
      questionText: "What is the meaning of the idiom 'To burn the candle at both ends'?",
      options: {
        A: "To be extremely frugal with resources",
        B: "To work exhausting hours from early morning to late at night",
        C: "To destroy evidence of wrongdoing",
        D: "To celebrate enthusiastically"
      },
      correctOption: "B",
      explanation: "'To burn the candle at both ends' means to exhaust oneself by working or partying late into the night and rising early in the morning.",
      recommendedTimeSeconds: 30,
    },
    {
      id: "verb_04",
      category: "verbal",
      subtopic: "Reading Comprehension",
      difficulty: "hard",
      questionText: "'Technological innovation does not merely accelerate productivity; it fundamentally reorganizes the human allocation of cognitive attention.' Which inference is most strongly supported by this statement?",
      options: {
        A: "Productivity decreases when cognitive attention shifts.",
        B: "Innovation primarily affects physical manufacturing processes.",
        C: "The primary consequence of technology is how people focus and direct mental effort.",
        D: "Human attention is finite and unaffected by tools."
      },
      correctOption: "C",
      explanation: "The passage asserts that technology 'fundamentally reorganizes the human allocation of cognitive attention,' which directly supports the inference that technology reshapes how people direct mental focus.",
      recommendedTimeSeconds: 50,
    },

    // --- Data Interpretation ---
    {
      id: "di_01",
      category: "data-interpretation",
      subtopic: "Tabular Data Analysis",
      difficulty: "medium",
      questionText: "A tech startup reports employee counts across 3 quarters: Q1: 40 Engineers, 10 Designers; Q2: 60 Engineers, 15 Designers; Q3: 90 Engineers, 18 Designers. What was the percentage increase in total staff from Q1 to Q3?",
      options: { A: "80%", B: "100%", C: "116%", D: "125%" },
      correctOption: "C",
      explanation: "Total Q1 staff = 40 + 10 = 50. Total Q3 staff = 90 + 18 = 108. Absolute increase = 108 - 50 = 58. Percentage increase = (58 / 50) × 100% = 116%.",
      recommendedTimeSeconds: 50,
    },
    {
      id: "di_02",
      category: "data-interpretation",
      subtopic: "Ratios in Charts",
      difficulty: "medium",
      questionText: "In a company of 600 employees, the ratio of Software Developers to QA Testers to Product Managers is 7 : 3 : 2. How many more Software Developers are there than QA Testers?",
      options: { A: "150", B: "200", C: "250", D: "350" },
      correctOption: "B",
      explanation: "Sum of ratio parts = 7 + 3 + 2 = 12 parts. Total employees = 600. Value of 1 part = 600 / 12 = 50. Difference between Developers and QA = 7 - 3 = 4 parts. Difference in count = 4 × 50 = 200 employees.",
      recommendedTimeSeconds: 40,
    },
  ];
}

// Read database from file, initializing if not present
export function readDB(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    const initial = getInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

// Write database atomically
export function writeDB(data: DatabaseSchema): void {
  ensureDataDir();
  const content = JSON.stringify(data, null, 2);
  const tmpFile = `${DB_FILE}.${Date.now()}_${Math.random().toString(36).substring(2, 7)}.tmp`;
  fs.writeFileSync(tmpFile, content, "utf-8");

  let retries = 8;
  while (retries > 0) {
    try {
      fs.renameSync(tmpFile, DB_FILE);
      return;
    } catch (err: any) {
      if (err.code === "EPERM" || err.code === "EBUSY" || err.code === "EEXIST") {
        retries--;
        if (retries === 0) {
          try {
            fs.copyFileSync(tmpFile, DB_FILE);
            try { fs.unlinkSync(tmpFile); } catch {}
            return;
          } catch {
            fs.writeFileSync(DB_FILE, content, "utf-8");
            try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
            return;
          }
        }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15);
      } else {
        throw err;
      }
    }
  }
}

// Serialized write path with async mutex queue
let writeMutex: Promise<unknown> = Promise.resolve();

/**
 * Executes a database mutation with exclusive write locking.
 * Chains through an async mutex queue, reads fresh data from disk,
 * executes the mutator, writes atomically to a temporary file, renames,
 * and releases the lock for the next operation in line.
 */
export async function updateDB<T>(mutator: (db: DatabaseSchema) => T | Promise<T>): Promise<T> {
  const currentLock = writeMutex;
  let release: () => void = () => {};
  writeMutex = new Promise<void>((resolve) => {
    release = resolve;
  });

  try {
    await currentLock;
    const db = readDB();
    const result = await mutator(db);
    writeDB(db);
    return result;
  } finally {
    release();
  }
}

// ============================================================================
// DATA ACCESS METHODS
// ============================================================================

// Users
export function findUserByEmail(email: string): User | undefined {
  const db = readDB();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  const db = readDB();
  return db.users.find((u) => u.id === id);
}

export async function createUser(user: User): Promise<User> {
  return updateDB((db) => {
    db.users.push(user);
    return user;
  });
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  return updateDB((db) => {
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
    return db.users[idx];
  });
}

// Resumes
export function getResumesByUserId(userId: string): Resume[] {
  const db = readDB();
  return db.resumes.filter((r) => r.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getResumeById(id: string, userId: string): Resume | undefined {
  const db = readDB();
  return db.resumes.find((r) => r.id === id && r.userId === userId);
}

export async function saveResume(resume: Resume): Promise<Resume> {
  return updateDB((db) => {
    const idx = db.resumes.findIndex((r) => r.id === resume.id && r.userId === resume.userId);
    if (idx >= 0) {
      db.resumes[idx] = { ...resume, updatedAt: new Date().toISOString() };
    } else {
      db.resumes.push({ ...resume, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    return resume;
  });
}

export const updateResume = saveResume;

export async function deleteResume(id: string, userId: string): Promise<boolean> {
  return updateDB((db) => {
    const initialLen = db.resumes.length;
    db.resumes = db.resumes.filter((r) => !(r.id === id && r.userId === userId));
    return db.resumes.length !== initialLen;
  });
}

export async function duplicateResume(id: string, userId: string): Promise<Resume | undefined> {
  return updateDB((db) => {
    const original = db.resumes.find((r) => r.id === id && r.userId === userId);
    if (!original) return undefined;

    const newResume: Resume = {
      ...JSON.parse(JSON.stringify(original)),
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.resumes.push(newResume);
    return newResume;
  });
}

// ATS Analyses
export async function saveATSAnalysis(analysis: ATSAnalysis): Promise<ATSAnalysis> {
  return updateDB((db) => {
    db.atsAnalyses.unshift(analysis);
    return analysis;
  });
}

export function getATSAnalysesByUserId(userId: string): ATSAnalysis[] {
  const db = readDB();
  return db.atsAnalyses.filter((a) => a.userId === userId);
}

// Mock Interviews
export async function createInterviewSession(session: InterviewSession): Promise<InterviewSession> {
  return updateDB((db) => {
    db.interviewSessions.unshift(session);
    return session;
  });
}

export function getInterviewSessionById(id: string, userId: string): InterviewSession | undefined {
  const db = readDB();
  return db.interviewSessions.find((s) => s.id === id && s.userId === userId);
}

export function getInterviewSessionsByUserId(userId: string): InterviewSession[] {
  const db = readDB();
  return db.interviewSessions.filter((s) => s.userId === userId);
}

export async function updateInterviewSession(session: InterviewSession): Promise<InterviewSession> {
  return updateDB((db) => {
    const idx = db.interviewSessions.findIndex((s) => s.id === session.id && s.userId === session.userId);
    if (idx >= 0) {
      db.interviewSessions[idx] = session;
    }
    return session;
  });
}

export const saveInterviewSession = updateInterviewSession;

// Aptitude
export function getAptitudeQuestions(category?: string, limit?: number): AptitudeQuestion[] {
  const db = readDB();
  let list = db.aptitudeQuestions;
  if (category && category !== "all") {
    list = list.filter((q) => q.category === category);
  }
  if (limit && limit > 0) {
    list = list.slice(0, limit);
  }
  return list;
}

export async function saveAptitudeAttempt(attempt: AptitudeAttempt): Promise<AptitudeAttempt> {
  return updateDB((db) => {
    db.aptitudeAttempts.unshift(attempt);
    return attempt;
  });
}

export function getAptitudeAttemptsByUserId(userId: string): AptitudeAttempt[] {
  const db = readDB();
  return db.aptitudeAttempts.filter((a) => a.userId === userId);
}

// Dashboard Aggregates
export function getDashboardStats(userId: string): DashboardStats {
  const db = readDB();
  const userResumes = db.resumes.filter((r) => r.userId === userId);
  const userInterviews = db.interviewSessions.filter((s) => s.userId === userId);
  const userATS = db.atsAnalyses.filter((a) => a.userId === userId);
  const userAptitude = db.aptitudeAttempts.filter((a) => a.userId === userId);

  const completedInterviews = userInterviews.filter((s) => s.status === "completed");
  const interviewAvgScore =
    completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / completedInterviews.length)
      : 0;

  const aptitudeAccuracy =
    userAptitude.length > 0
      ? Math.round(userAptitude.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / userAptitude.length)
      : 0;

  // Build aggregated timeline feed
  const activityList: DashboardStats["recentActivity"] = [];

  userResumes.slice(0, 3).forEach((r) => {
    activityList.push({
      id: r.id,
      type: "resume",
      title: `Updated resume: ${r.title}`,
      subtitle: `${r.experience?.length || 0} experiences, ${r.projects?.length || 0} projects documented`,
      timestamp: r.updatedAt,
      link: `/resumes/${r.id}`,
    });
  });

  userATS.slice(0, 3).forEach((a) => {
    activityList.push({
      id: a.id,
      type: "ats",
      title: `ATS Scan: ${a.jobTitle || "Job Match"} at ${a.jobCompany || "Company"}`,
      subtitle: `Compatibility Match: ${a.overallScore || a.score || 0}% (${a.matchedKeywords?.length || 0} keywords matched)`,
      timestamp: a.createdAt,
      link: `/ats-checker`,
    });
  });

  completedInterviews.slice(0, 3).forEach((s) => {
    activityList.push({
      id: s.id,
      type: "interview",
      title: `Mock Interview: ${s.category.toUpperCase()} (${s.targetRole})`,
      subtitle: `Overall Score: ${s.overallScore || 0}% — ${s.questions?.length || 0} questions evaluated`,
      timestamp: s.completedAt || s.createdAt,
      link: `/mock-interview`,
    });
  });

  userAptitude.slice(0, 3).forEach((a) => {
    activityList.push({
      id: a.id,
      type: "aptitude",
      title: `Aptitude Practice: ${(a.category || "General").toUpperCase()}`,
      subtitle: `Accuracy: ${a.accuracy}% (${a.correctAnswers || a.score || 0}/${a.totalQuestions} correct in ${Math.round((a.timeSpentSeconds || 0) / 60)} min)`,
      timestamp: a.createdAt,
      link: `/aptitude`,
    });
  });

  // Sort chronological descending
  activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    totalResumes: userResumes.length,
    interviewSessionsCount: completedInterviews.length,
    interviewAvgScore,
    aptitudeTestsCount: userAptitude.length,
    aptitudeAccuracy,
    atsChecksCount: userATS.length,
    recentActivity: activityList.slice(0, 8),
  };
}
