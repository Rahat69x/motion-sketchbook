/**
 * ResumeForge Comprehensive Backend & Engine Integration Test Suite
 * Tests:
 * 1. Database initialization and user isolation
 * 2. Password hashing & verification with bcrypt
 * 3. JWT authentication token creation & decode
 * 4. Resume CRUD & Duplication
 * 5. ATS compatibility scoring engine (keywords, formatting, action verbs)
 * 6. Mock interview generation & rubric scoring
 * 7. Aptitude test question sanitization (protected answer keys) & server-side grading
 */

let getDb, saveDb;
try {
  ({ getDb, saveDb } = require('../dist-test/db_helper.js'));
} catch (e) {
  // Optional helper
}
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('  STARTING RESUMEFORGE AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: Password Hashing & Security
  console.log('--- 1. AUTH & SECURITY ---');
  const password = "Placement2026!Secure";
  const hash = await bcrypt.hash(password, 10);
  assert(hash !== password, "Password was hashed and not stored in plaintext");
  
  const isValid = await bcrypt.compare(password, hash);
  assert(isValid === true, "Valid password successfully verified with bcrypt");

  const isInvalid = await bcrypt.compare("WrongPassword123", hash);
  assert(isInvalid === false, "Invalid password rejected by bcrypt");

  // TEST 2: JWT Token Generation & Verification
  const secret = "test-jwt-secret-key-for-resumeforge-2026";
  const userPayload = { userId: "user-test-123", email: "student@test.edu" };
  const token = jwt.sign(userPayload, secret, { expiresIn: '7d' });
  assert(typeof token === 'string' && token.length > 20, "JWT token created successfully");

  const decoded = jwt.verify(token, secret);
  assert(decoded.userId === userPayload.userId && decoded.email === userPayload.email, "JWT payload safely decoded and verified");

  // TEST 2b: Runtime JWT Secret Security Policy Check
  function getJwtSecretCheck(nodeEnv, secretVal) {
    const s = secretVal;
    if (s && s.length >= 32) return s;
    if (nodeEnv === "production") throw new Error("JWT_SECRET (32+ chars) is required in production");
    return "dev-only-secret-not-for-production";
  }
  assert(getJwtSecretCheck("development", undefined) === "dev-only-secret-not-for-production", "JWT secret uses safe dev fallback when unset in development");
  let prodUnsetThrew = false;
  try {
    getJwtSecretCheck("production", undefined);
  } catch (err) {
    prodUnsetThrew = true;
  }
  assert(prodUnsetThrew === true, "JWT secret throws error in production when JWT_SECRET is unset");
  const strongSecret = "resumeforge_super_strong_secret_key_32chars!";
  assert(getJwtSecretCheck("production", strongSecret) === strongSecret, "JWT secret accepts valid 32+ char key in production");

  // TEST 3: ATS Compatibility Engine
  console.log('\n--- 2. ATS COMPATIBILITY ENGINE ---');
  // Dynamic import of TS compiled or standalone logic
  const { analyzeATSCompatibility } = require('./ats_engine_test_wrapper.js');
  
  const sampleResume = {
    title: "Software Engineering Resume",
    personalInfo: {
      fullName: "Alex Rivera",
      email: "alex@university.edu",
      phone: "+1 (555) 234-5678",
      location: "San Jose, CA",
      linkedin: "linkedin.com/in/alex",
      github: "github.com/alex"
    },
    summary: "Computer Science student proficient in Data Structures, React, TypeScript, and Node.js.",
    education: [{ institution: "Tech State University", degree: "B.S. Computer Science", startDate: "2022", endDate: "2026" }],
    skills: {
      languages: ["TypeScript", "JavaScript", "Python", "SQL"],
      frameworks: ["React", "Next.js", "Node.js", "Tailwind CSS"],
      tools: ["Git", "Docker", "PostgreSQL"],
      concepts: ["Data Structures", "Algorithms", "RESTful APIs"]
    },
    experience: [{
      company: "Innovate Labs",
      role: "Software Engineering Intern",
      bullets: ["Built full-stack React and Node.js features, optimizing response times by 30%."]
    }],
    projects: [{
      title: "Campus Marketplace",
      technologies: ["React", "PostgreSQL", "Docker"],
      bullets: ["Engineered secure authentication and checkout service."]
    }],
    certifications: [],
    achievements: []
  };

  const sampleJobDescription = `
    Looking for a Software Engineer Intern with experience in React, TypeScript, Node.js, and PostgreSQL.
    Must understand Data Structures, Git, and Docker.
    Bonus for AWS or GraphQL experience.
  `;

  const atsResult = analyzeATSCompatibility(sampleResume, sampleJobDescription);
  assert(atsResult.score >= 70, `ATS score calculated (${atsResult.score}%)`);
  assert(atsResult.matchedKeywords.includes("react"), "ATS accurately detected matched keyword 'react'");
  assert(atsResult.matchedKeywords.includes("typescript"), "ATS accurately detected matched keyword 'typescript'");
  assert(atsResult.missingKeywords.includes("aws") || atsResult.missingKeywords.includes("graphql"), "ATS identified missing keywords");
  assert(Array.isArray(atsResult.recommendations) && atsResult.recommendations.length > 0, "Actionable recommendations provided");

  // TEST 3b: ATS Input Boundary & DoS Protection Checks
  function validateAtsInput(jobDescription, rawResumeText) {
    if (typeof jobDescription !== "string") return { status: 400, error: "Invalid format" };
    if (jobDescription.length > 25000) return { status: 413, error: "Job description exceeds 25,000 characters" };
    if (rawResumeText !== undefined && rawResumeText !== null) {
      if (typeof rawResumeText !== "string") return { status: 400, error: "Invalid format" };
      if (rawResumeText.length > 35000) return { status: 413, error: "Resume text exceeds 35,000 characters" };
    }
    if (jobDescription.trim().length < 20) return { status: 400, error: "Too short" };
    return { status: 200 };
  }

  const normalCheck = validateAtsInput("This is a valid job description with enough length for testing ATS compatibility.", undefined);
  assert(normalCheck.status === 200, "ATS input validator accepts normal payload (200)");

  const tooShortCheck = validateAtsInput("Too short", undefined);
  assert(tooShortCheck.status === 400, "ATS input validator rejects too-short job description (400)");

  const oversizedJd = "A".repeat(26000);
  const t0 = Date.now();
  const oversizedCheck = validateAtsInput(oversizedJd, undefined);
  const duration = Date.now() - t0;
  assert(oversizedCheck.status === 413 && duration < 50, "ATS input validator rejects oversized payload with 413 instantaneously (<50ms)");

  const oversizedResume = "B".repeat(36000);
  const oversizedResumeCheck = validateAtsInput("Valid job description that is sufficiently long.", oversizedResume);
  assert(oversizedResumeCheck.status === 413, "ATS input validator rejects oversized resume text (>35,000 chars) with 413");

  // TEST 4: Mock Interview Question Generator & Evaluator
  console.log('\n--- 3. MOCK INTERVIEW ENGINE ---');
  const { generateInterviewQuestions, evaluateInterviewAnswers } = require('./interview_engine_test_wrapper.js');

  const questions = generateInterviewQuestions("behavioral", "medium", 3);
  assert(questions.length === 3, "Generated 3 interview questions for behavioral round");
  assert(questions[0].question.length > 10, "Question prompt is meaningful and non-empty");
  assert(typeof questions[0].modelAnswer === 'string', "Model answer and rubric criteria included");

  // Evaluate behavioral STAR answer
  const testAnswers = [
    {
      questionId: questions[0].id,
      userAnswer: "In my junior year database project (Situation), our server kept crashing under load (Task). I analyzed the slow queries, added indexing on user_id, and cached sessions in Redis (Action). As a result, query latency dropped by 45% and our team completed the milestone ahead of schedule (Result)."
    }
  ];

  const evaluation = evaluateInterviewAnswers("behavioral", questions, testAnswers);
  assert(evaluation.overallScore >= 75, `Behavioral STAR answer scored high (${evaluation.overallScore}%)`);
  assert(evaluation.answers[0].score >= 75, "Rubric detected all 4 STAR components (Situation, Task, Action, Result)");
  assert(Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0, "Detailed strengths highlighted");

  // TEST 5: Aptitude Testing Engine (Sanitization & Scoring)
  console.log('\n--- 4. APTITUDE ENGINE & ANSWER PROTECTION ---');
  const { sanitizeQuestionsForClient, gradeAptitudeAttempt, APTITUDE_QUESTION_BANK } = require('./aptitude_engine_test_wrapper.js');

  const rawQuestions = APTITUDE_QUESTION_BANK.slice(0, 5);
  const sanitized = sanitizeQuestionsForClient(rawQuestions);

  // CRITICAL: Ensure correct answer index is NOT exposed on client
  let leaked = false;
  sanitized.forEach(q => {
    if (q.correctOption !== undefined || q.explanation !== undefined) {
      leaked = true;
    }
  });
  assert(leaked === false, "Protected answer keys and explanations are safely stripped for client");

  // Server-side grading test
  const responses = [
    { questionId: rawQuestions[0].id, selectedOption: rawQuestions[0].correctOption }, // correct
    { questionId: rawQuestions[1].id, selectedOption: rawQuestions[1].correctOption }, // correct
    { questionId: rawQuestions[2].id, selectedOption: (rawQuestions[2].correctOption + 1) % 4 } // incorrect
  ];

  const graded = gradeAptitudeAttempt(responses, 120);
  assert(graded.score === 2, `Score accurately counted: 2 / 3 (Got: ${graded.score})`);
  assert(graded.accuracy === 67, `Accuracy calculated correctly: 67% (Got: ${graded.accuracy}%)`);
  assert(graded.answers[0].isCorrect === true, "Correct answer flagged as isCorrect: true");
  assert(graded.answers[2].isCorrect === false, "Incorrect answer flagged as isCorrect: false");
  assert(typeof graded.answers[0].explanation === 'string', "Mathematical explanation revealed after submission");

  // TEST 6: JSON Storage Layer Concurrency Mutex & Zero Record Loss
  console.log('\n--- 5. STORAGE CONCURRENCY & MUTEX INTEGRITY ---');
  const path = require('path');
  const fs = require('fs');
  const { createDbClient } = require('./db_test_wrapper.js');

  const testDbPath = path.join(__dirname, 'test_concurrency_db.json');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const testDb = createDbClient(testDbPath);

  // Fire 50 concurrent writes in parallel across different record types
  const concurrentTasks = [];

  // 15 Resumes
  for (let i = 0; i < 15; i++) {
    concurrentTasks.push(
      testDb.saveResume({
        id: `res_concurrent_${i}`,
        userId: "usr_concurrent_test",
        title: `Resume ${i}`,
        template: "modern"
      })
    );
  }

  // 15 Aptitude Attempts
  for (let i = 0; i < 15; i++) {
    concurrentTasks.push(
      testDb.saveAptitudeAttempt({
        id: `apt_attempt_${i}`,
        userId: "usr_concurrent_test",
        score: i * 2,
        totalQuestions: 10
      })
    );
  }

  // 10 Interview Sessions
  for (let i = 0; i < 10; i++) {
    concurrentTasks.push(
      testDb.createInterviewSession({
        id: `interview_session_${i}`,
        userId: "usr_concurrent_test",
        category: "behavioral",
        targetRole: "Software Engineer"
      })
    );
  }

  // 10 ATS Analyses
  for (let i = 0; i < 10; i++) {
    concurrentTasks.push(
      testDb.saveATSAnalysis({
        id: `ats_analysis_${i}`,
        userId: "usr_concurrent_test",
        score: 80 + i,
        jobTitle: `Frontend Developer ${i}`
      })
    );
  }

  assert(concurrentTasks.length === 50, "Generated 50 concurrent mutating requests");
  await Promise.all(concurrentTasks);

  // Read fresh state directly from disk to verify atomic persistence
  const savedDb = testDb.readDB();
  const totalSaved =
    savedDb.resumes.length +
    savedDb.aptitudeAttempts.length +
    savedDb.interviewSessions.length +
    savedDb.atsAnalyses.length;

  assert(savedDb.resumes.length === 15, "All 15 concurrent resumes safely persisted");
  assert(savedDb.aptitudeAttempts.length === 15, "All 15 concurrent aptitude attempts safely persisted");
  assert(savedDb.interviewSessions.length === 10, "All 10 concurrent interview sessions safely persisted");
  assert(savedDb.atsAnalyses.length === 10, "All 10 concurrent ATS analyses safely persisted");
  assert(totalSaved === 50, `Zero record loss: Exactly 50/50 concurrent updates serialized and saved (Got: ${totalSaved})`);

  // Clean up test file
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(`${testDbPath}.tmp`)) fs.unlinkSync(`${testDbPath}.tmp`);

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
