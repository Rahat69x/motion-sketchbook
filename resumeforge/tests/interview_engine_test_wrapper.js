function generateInterviewQuestions(category, difficulty, count = 3) {
  const pool = [
    {
      id: "q-1",
      category,
      difficulty,
      question: "Describe a challenging technical project or bug you encountered and how you resolved it.",
      modelAnswer: "Effective STAR response: Situation context, clear Task ownership, Action taken with specific tools, and measurable Result."
    },
    {
      id: "q-2",
      category,
      difficulty,
      question: "Tell me about a time you had a disagreement with a team member. How did you handle it?",
      modelAnswer: "Demonstrates empathy, focus on objective data, constructive communication, and alignment on project goals."
    },
    {
      id: "q-3",
      category,
      difficulty,
      question: "Why are you interested in this engineering role and what sets you apart from other candidates?",
      modelAnswer: "Clear alignment of skills, genuine interest in company mission, and track record of proactive learning."
    }
  ];
  return pool.slice(0, count);
}

function evaluateInterviewAnswers(category, questions, answers) {
  const gradedAnswers = answers.map(a => {
    const text = (a.userAnswer || "").toLowerCase();
    const hasS = text.includes("situation") || text.includes("context") || text.includes("project");
    const hasT = text.includes("task") || text.includes("responsibility") || text.includes("goal");
    const hasA = text.includes("action") || text.includes("built") || text.includes("implemented") || text.includes("analyzed");
    const hasR = text.includes("result") || text.includes("improved") || text.includes("outcome") || text.includes("%");

    let starCount = [hasS, hasT, hasA, hasR].filter(Boolean).length;
    let score = 50 + starCount * 12;
    score = Math.min(95, score);

    return {
      questionId: a.questionId,
      userAnswer: a.userAnswer,
      score,
      feedback: `Demonstrates good structure. Detected ${starCount} of 4 STAR components.`
    };
  });

  const avg = Math.round(gradedAnswers.reduce((sum, g) => sum + g.score, 0) / Math.max(1, gradedAnswers.length));

  return {
    overallScore: avg,
    answers: gradedAnswers,
    strengths: ["Structured delivery", "Included concrete context"],
    improvements: ["Quantify business and engineering impact with exact metrics"],
    summary: "Solid placement readiness foundation."
  };
}

module.exports = {
  generateInterviewQuestions,
  evaluateInterviewAnswers
};
