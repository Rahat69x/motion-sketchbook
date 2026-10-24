const APTITUDE_QUESTION_BANK = [
  {
    id: "apt-quant-1",
    category: "quantitative",
    difficulty: "medium",
    question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
    options: ["120 metres", "180 metres", "150 metres", "324 metres"],
    correctOption: 2,
    explanation: "Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of Train = Speed * Time = (50/3) * 9 = 150 metres."
  },
  {
    id: "apt-logic-1",
    category: "logical",
    difficulty: "easy",
    question: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?",
    options: ["(1/3)", "(1/8)", "(2/8)", "(1/16)"],
    correctOption: 1,
    explanation: "This is a simple division series; each number is one-half of the previous number. (1/4) / 2 = 1/8."
  },
  {
    id: "apt-verb-1",
    category: "verbal",
    difficulty: "easy",
    question: "Find the correctly spelled word:",
    options: ["Acccommodation", "Accommodation", "Acommodation", "Accomodation"],
    correctOption: 1,
    explanation: "The correct spelling is 'Accommodation' (double c, double m)."
  }
];

function sanitizeQuestionsForClient(questions) {
  return questions.map(q => {
    const { correctOption, explanation, ...clientSafe } = q;
    return clientSafe;
  });
}

function gradeAptitudeAttempt(responses, timeSpentSeconds = 60) {
  let score = 0;
  const gradedAnswers = responses.map(res => {
    const q = APTITUDE_QUESTION_BANK.find(item => item.id === res.questionId);
    if (!q) {
      return { questionId: res.questionId, selectedOption: res.selectedOption, isCorrect: false };
    }
    const isCorrect = res.selectedOption === q.correctOption;
    if (isCorrect) score++;

    return {
      questionId: res.questionId,
      selectedOption: res.selectedOption,
      correctOption: q.correctOption,
      isCorrect,
      explanation: q.explanation
    };
  });

  const accuracy = Math.round((score / Math.max(1, responses.length)) * 100);

  return {
    score,
    totalQuestions: responses.length,
    accuracy,
    answers: gradedAnswers,
    timeSpentSeconds
  };
}

module.exports = {
  APTITUDE_QUESTION_BANK,
  sanitizeQuestionsForClient,
  gradeAptitudeAttempt
};
