
export function normalizeQuestion(question) {
  return {
    ...question,
    id: String(question.id),
    exam: question.exam || "cg-vyapam",
    subject: question.subject || "general",
    topic: question.topic || "general",
    difficulty: question.difficulty || "medium",
    language: question.language || "hi",
    options: question.options || [],
    explanation: question.explanation || "",
    source: question.source || "",
    year: question.year ?? null,
    verified: question.verified === true
  };
}

export function isValidQuestion(question) {
  return Boolean(
    question &&
    question.id &&
    question.question &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    Number.isInteger(question.answer) &&
    question.answer >= 0 &&
    question.answer < question.options.length
  );
}

export function checkAnswer(question, selectedAnswer) {
  return Number(selectedAnswer) === Number(question.answer);
}
