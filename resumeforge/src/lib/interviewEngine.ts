import { InterviewCategory, InterviewDifficulty, InterviewQuestionItem, InterviewSession } from "./types";

interface QuestionBankItem {
  id: string;
  category: InterviewCategory;
  roles: string[];
  difficulty: InterviewDifficulty;
  questionText: string;
  expectedConcepts: string[];
  modelAnswerSnippet: string;
  actionableTip: string;
}

const QUESTION_BANK: QuestionBankItem[] = [
  // --- Behavioral (STAR) ---
  {
    id: "beh_01",
    category: "behavioral",
    roles: ["Software Engineer", "Frontend Developer", "Backend Developer", "General"],
    difficulty: "junior",
    questionText: "Tell me about a time when you faced a significant technical hurdle during a project. How did you overcome it?",
    expectedConcepts: ["Clear Situation context", "Specific technical hurdle / root cause", "Actions taken (debugging, researching, testing)", "Measurable outcome or lesson learned"],
    modelAnswerSnippet: "Structure with STAR: In my university compiler project (Situation), our parser ran out of stack memory on recursive inputs (Task). I profiled the call tree using Valgrind, identified deep recursion on nested expressions, and refactored the parser into an iterative loop with an explicit heap-allocated stack (Action). This reduced memory footprint by 70% and passed all 50 automated test fixtures (Result).",
    actionableTip: "Avoid saying 'we fixed it' without clarifying your personal technical contribution. Ensure you state a measurable outcome.",
  },
  {
    id: "beh_02",
    category: "behavioral",
    roles: ["Software Engineer", "Product Manager", "Data Analyst", "General"],
    difficulty: "junior",
    questionText: "Describe a situation where you had a disagreement with a team member regarding an engineering decision. How did you handle it?",
    expectedConcepts: ["Professional conflict resolution", "Data-driven or benchmark comparison", "Respectful discussion", "Consensus and project progression"],
    modelAnswerSnippet: "During our capstone project, a teammate wanted to use MongoDB while I advocated for PostgreSQL. I scheduled a quick 30-minute whiteboard session where we charted our exact entity relationships and query patterns. Because 80% of our queries required multi-table relational joins with strict transaction integrity, we ran a quick benchmark showing PostgreSQL had lower latency. We agreed on PostgreSQL, divided the schema migrations, and delivered the milestone a week early.",
    actionableTip: "Highlight objectivity: use benchmarks, user requirements, or maintainability trade-offs rather than subjective preferences.",
  },
  {
    id: "beh_03",
    category: "behavioral",
    roles: ["Software Engineer", "General"],
    difficulty: "junior",
    questionText: "Tell me about a time you made a mistake in your code that impacted others. How did you handle the aftermath?",
    expectedConcepts: ["Ownership / Accountability", "Immediate remediation", "Transparent communication", "Preventative measures (automated tests, linter)"],
    modelAnswerSnippet: "I merged a pull request with an unvalidated environment variable that broke our staging deployment. I immediately owned the error in our Slack channel, reverted the commit within 5 minutes to restore the team's testing workflow, and then wrote an explicit configuration validator using Zod along with a pre-push Git hook so missing variables fail fast during local development.",
    actionableTip: "Interviewers look for humility, swift corrective action, and adding automated safety guards so the same error cannot reoccur.",
  },

  // --- HR / Cultural ---
  {
    id: "hr_01",
    category: "hr",
    roles: ["Software Engineer", "General"],
    difficulty: "junior",
    questionText: "Why are you interested in joining our engineering team, and what distinguishes you from other fresh graduates?",
    expectedConcepts: ["Company alignment / culture", "Curiosity and eagerness to learn", "Demonstrated portfolio / self-directed projects", "Collaborative mindset"],
    modelAnswerSnippet: "I've followed your engineering team's tech blog, specifically your recent migration to edge compute. What distinguishes me is that beyond theoretical coursework, I have built and maintained 4 full-stack projects with real users, automated CI/CD workflows, and written comprehensive unit test suites. I'm excited to bring that proactive builder mindset and learn from your senior engineers.",
    actionableTip: "Connect your personal passion directly to the company's real mission, product, or engineering values.",
  },
  {
    id: "hr_02",
    category: "hr",
    roles: ["Software Engineer", "General"],
    difficulty: "junior",
    questionText: "Where do you see your engineering career evolving in the next three to five years?",
    expectedConcepts: ["Technical depth mastery", "System ownership", "Mentorship / collaborative growth", "Continuous learning"],
    modelAnswerSnippet: "Over the next three years, my goal is to progress from mastering production codebase conventions and shipping high-reliability features to taking end-to-end architectural ownership of complex service components. Long-term, I want to mentor incoming interns and contribute to core infrastructure design decisions.",
    actionableTip: "Balance realistic short-term execution (absorbing standards, clean code) with ambitious long-term contributions (architecture, mentorship).",
  },

  // --- Technical: Core & Full-Stack ---
  {
    id: "tech_01",
    category: "technical",
    roles: ["Software Engineer", "Frontend Developer", "Full-Stack Engineer"],
    difficulty: "junior",
    questionText: "Explain the difference between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG). When would you choose each?",
    expectedConcepts: ["Execution environment (browser vs Node server)", "Initial page load / Time-To-Interactive (TTI)", "SEO implications", "Trade-offs between build time, server cost, and freshness"],
    modelAnswerSnippet: "CSR renders HTML dynamically in the browser via JavaScript; it's ideal for private authenticated dashboards where SEO doesn't matter. SSR renders fresh HTML on the server for every incoming request, optimal for highly dynamic data requiring immediate SEO. SSG pre-renders HTML at build time, offering unbeatable CDN performance and security for blogs or documentation with infrequently changing content.",
    actionableTip: "Structure your answer by defining the core mechanism first, then listing concrete use-cases and performance trade-offs.",
  },
  {
    id: "tech_02",
    category: "technical",
    roles: ["Software Engineer", "Backend Developer", "Full-Stack Engineer"],
    difficulty: "junior",
    questionText: "How do relational databases maintain ACID properties? Briefly explain each component.",
    expectedConcepts: ["Atomicity (all or nothing / rollback)", "Consistency (schema constraints & valid states)", "Isolation (concurrency / transaction levels)", "Durability (WAL / non-volatile commit)"],
    modelAnswerSnippet: "Atomicity ensures all operations in a transaction succeed or all are rolled back. Consistency guarantees that the database transitions strictly between valid schema states. Isolation prevents concurrent transactions from interfering with one another through locking or MVCC. Durability ensures that once committed, writes survive crashes via Write-Ahead Logging (WAL) on persistent storage.",
    actionableTip: "Mention real-world implementation details like WAL (Write-Ahead Logging) or MVCC (Multi-Version Concurrency Control) to demonstrate true depth.",
  },
  {
    id: "tech_03",
    category: "technical",
    roles: ["Software Engineer", "Backend Developer", "Full-Stack Engineer"],
    difficulty: "junior",
    questionText: "What is the event loop in Node.js / JavaScript, and how does asynchronous I/O work under the hood?",
    expectedConcepts: ["Single-threaded call stack", "Libuv thread pool", "Macrotask queue vs Microtask queue (Promises)", "Non-blocking event demultiplexer"],
    modelAnswerSnippet: "JavaScript operates with a single execution call stack. When an asynchronous operation (like a file read or database query) is initiated, Node delegates the blocking task to the Libuv worker thread pool or OS kernel. Once completed, the callback enters the event queue. Microtasks (like Promise resolutions) take priority and drain before the next tick of the macrotask queue (like setTimeout).",
    actionableTip: "Contrast microtasks (Promise.then, queueMicrotask) with macrotasks (setTimeout, setInterval, I/O) to show deep runtime understanding.",
  },

  // --- System Design & Architecture ---
  {
    id: "sys_01",
    category: "system-design",
    roles: ["Software Engineer", "Backend Developer"],
    difficulty: "junior",
    questionText: "How would you design a URL shortener service like TinyURL? Discuss the core components and database considerations.",
    expectedConcepts: ["API endpoints (POST /shorten, GET /:code)", "Hashing / Base62 encoding of auto-increment IDs", "Database schema & indexing", "Caching layer (Redis) for hot reads", "Handling collisions & redirection"],
    modelAnswerSnippet: "I would create two primary endpoints: POST /api/shorten and GET /:shortCode. For code generation, Base62 encoding over a distributed auto-incrementing 64-bit integer avoids hashing collisions and yields 7-character URLs supporting billions of records. In the database (PostgreSQL or NoSQL), shortCode is indexed as a unique primary key. Because read traffic exceeds write traffic 100:1, hot redirects are cached in Redis with an LRU eviction policy.",
    actionableTip: "Mention the read-to-write ratio immediately to justify caching architecture, and explain why Base62 over an ID is cleaner than MD5/SHA256 truncation.",
  },
];

/**
 * Creates an interview session with curated questions based on user preferences.
 */
export function generateInterviewSession(
  userId: string,
  category: InterviewCategory,
  targetRole: string,
  difficulty: InterviewDifficulty,
  questionCount: number = 3
): InterviewSession {
  // Filter questions matching category or fallback to general
  let pool = QUESTION_BANK.filter((q) => q.category === category);
  if (pool.length < questionCount) {
    const generalPool = QUESTION_BANK.filter((q) => q.category !== category);
    pool = [...pool, ...generalPool];
  }

  // Shuffle and select
  const selected = pool.sort(() => 0.5 - Math.random()).slice(0, questionCount);

  const questions: InterviewQuestionItem[] = selected.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    category: q.category,
    expectedConcepts: q.expectedConcepts,
    timeLimitSeconds: 180,
  }));

  return {
    id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    category,
    targetRole,
    difficulty,
    status: "in_progress",
    overallScore: 0,
    feedbackSummary: "Interview in progress. Complete all questions to view final comprehensive feedback.",
    questions,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * Transparent Rubric-Based Evaluation for an interview question answer.
 */
export function evaluateAnswer(
  question: InterviewQuestionItem,
  answer: string
): NonNullable<InterviewQuestionItem["rubricFeedback"]> & { score: number } {
  const trimmed = answer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const answerLower = trimmed.toLowerCase();

  // 1. Length & Substance Metric
  let lengthFactor = 0;
  if (wordCount >= 45 && wordCount <= 280) {
    lengthFactor = 1.0;
  } else if (wordCount > 280) {
    lengthFactor = 0.90; // slightly verbose
  } else if (wordCount >= 20) {
    lengthFactor = wordCount / 45;
  } else {
    lengthFactor = 0.35; // too terse
  }

  // 2. Expected Concepts Matching
  const expectedList = question.expectedConcepts || [];
  let conceptsMatched = 0;
  expectedList.forEach((concept) => {
    const terms = concept.toLowerCase().split(/[\s/()]+/).filter((t) => t.length > 3);
    const hasTerm = terms.some((t) => answerLower.includes(t));
    if (hasTerm) conceptsMatched++;
  });

  const conceptCoverage = expectedList.length > 0 ? conceptsMatched / expectedList.length : 0.7;

  // 3. Behavioral STAR Framework Analysis
  let star = { situation: false, task: false, action: false, result: false };
  if (question.category === "behavioral") {
    star = {
      situation: /situation|when I was|during|at my|in our|project|university|team/i.test(answerLower),
      task: /task|goal|responsible|needed to|had to|objective|challenge/i.test(answerLower),
      action: /action|I decided|I built|I implemented|I refactored|I communicated|I created|I researched/i.test(answerLower),
      result: /result|outcome|finally|as a result|increased|decreased|succeeded|completed|won/i.test(answerLower),
    };
  }

  // 4. Calculate Sub-Scores (0 to 100)
  const relevanceScore = Math.min(100, Math.round(50 * lengthFactor + 50 * conceptCoverage));
  const clarityScore = Math.min(100, Math.round(60 + (wordCount >= 40 ? 25 : 10) + (trimmed.includes(".") ? 15 : 0)));
  const technicalDepthScore = Math.min(100, Math.round(40 * lengthFactor + 60 * conceptCoverage));

  const totalQuestionScore = Math.round(relevanceScore * 0.4 + clarityScore * 0.3 + technicalDepthScore * 0.3);

  // 5. Construct Critique & Guidance
  const bankRef = QUESTION_BANK.find((q) => q.id === question.id);
  let critique = "";

  if (wordCount < 30) {
    critique = "Your answer is quite brief. In placement interviews, flesh out your explanation with concrete real-world context, technical tools, and specific actions.";
  } else if (conceptsMatched >= 3) {
    critique = `Strong answer! You successfully incorporated key technical/architectural concepts (${conceptsMatched}/${expectedList.length} target themes addressed).`;
  } else {
    critique = "Solid starting point. To elevate your response, incorporate deeper specifics on the exact engineering mechanisms and measurable results.";
  }

  return {
    score: totalQuestionScore,
    relevanceScore,
    clarityScore,
    technicalDepthScore,
    starAdherence: question.category === "behavioral" ? star : undefined,
    critique,
    modelAnswerSnippet: bankRef?.modelAnswerSnippet || "Focus on structured problem solving, clear ownership, and measurable impact.",
    actionableTip: bankRef?.actionableTip || "Highlight technical trade-offs and justify your architectural decisions.",
  };
}
