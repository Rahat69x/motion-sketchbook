import { AptitudeCategory, AptitudeQuestion, AptitudeAttempt, AptitudeUserResponse } from "./types";
import { getAptitudeQuestions, saveAptitudeAttempt } from "./db";

/**
 * Public client-safe representation of an aptitude question
 * (Hides correctOption and explanation before submission)
 */
export interface PublicAptitudeQuestion {
  id: string;
  category: AptitudeCategory;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  recommendedTimeSeconds: number;
}

/**
 * Strips answer keys for safe client-side delivery before test submission.
 */
export function sanitizeQuestionForClient(q: AptitudeQuestion): PublicAptitudeQuestion {
  return {
    id: q.id,
    category: q.category,
    subtopic: q.subtopic || "General",
    difficulty: q.difficulty,
    questionText: q.questionText || q.question || "",
    options: q.options,
    recommendedTimeSeconds: q.recommendedTimeSeconds || 60,
  };
}

/**
 * Evaluates submitted aptitude responses securely on the server.
 */
export function evaluateAptitudeTest(
  userId: string,
  category: AptitudeCategory | "all",
  mode: "practice" | "timed",
  userAnswers: Array<{ questionId: string; selectedOption: string; timeSpentSeconds: number }>
): {
  attempt: AptitudeAttempt;
  results: Array<{
    question: AptitudeQuestion;
    selectedOption: string;
    isCorrect: boolean;
    explanation: string;
  }>;
} {
  const allQuestions = getAptitudeQuestions();
  const qMap = new Map<string, AptitudeQuestion>();
  allQuestions.forEach((q) => qMap.set(q.id, q));

  let correctCount = 0;
  let totalTime = 0;
  const responses: AptitudeUserResponse[] = [];
  const results: Array<{
    question: AptitudeQuestion;
    selectedOption: string;
    isCorrect: boolean;
    explanation: string;
  }> = [];

  userAnswers.forEach((ans) => {
    const q = qMap.get(ans.questionId);
    if (!q) return;

    const isCorrect = ans.selectedOption.toUpperCase() === q.correctOption.toUpperCase();
    if (isCorrect) correctCount++;
    totalTime += ans.timeSpentSeconds || 0;

    responses.push({
      questionId: q.id,
      selectedOption: ans.selectedOption,
      isCorrect,
      timeSpentSeconds: ans.timeSpentSeconds || 0,
    });

    results.push({
      question: q,
      selectedOption: ans.selectedOption,
      isCorrect,
      explanation: q.explanation || "",
    });
  });

  const totalQuestions = userAnswers.length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const attempt: AptitudeAttempt = {
    id: `apt_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    category,
    mode,
    totalQuestions,
    correctAnswers: correctCount,
    accuracy,
    timeSpentSeconds: totalTime,
    responses,
    createdAt: new Date().toISOString(),
  };

  saveAptitudeAttempt(attempt);

  return { attempt, results };
}
