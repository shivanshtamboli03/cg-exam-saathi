
export function normalizeQuestion(question) {
  if (!question || typeof question !== "object") return null;

  return {
    ...question,
    id: String(question.id ?? "").trim(),
    exam: question.exam || "cg-vyapam",
    subject: question.subject || "general",
    topic: question.topic || "general",
    difficulty: question.difficulty || "medium",
    language: question.language || "hi",
    options: Array.isArray(question.options) ? question.options : [],
    explanation: question.explanation || "",
    source: question.source || "",
    year: question.year ?? null,
    verified: question.verified === true
  };
}

export function isValidQuestion(q) {
  return Boolean(
    q &&
    String(q.id ?? "").trim() &&
    typeof q.question === "string" &&
    q.question.trim() &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.every(o => typeof o === "string" && o.trim()) &&
    Number.isInteger(q.answer) &&
    q.answer >= 0 &&
    q.answer < q.options.length
  );
}

export function validateQuestion(q) {
  const errors = [];
  const warnings = [];

  if (!q || typeof q !== "object" || Array.isArray(q)) {
    return { valid: false, errors: ["Invalid question object"], warnings };
  }

  if (!String(q.id ?? "").trim()) errors.push("Missing ID");
  if (!q.question?.trim()) errors.push("Missing question text");

  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push("At least 2 options required");
  } else if (q.options.some(o => typeof o !== "string" || !o.trim())) {
    errors.push("Empty or invalid option");
  }

  if (
    !Number.isInteger(q.answer) ||
    !Array.isArray(q.options) ||
    q.answer < 0 ||
    q.answer >= q.options.length
  ) {
    errors.push("Invalid answer index");
  }

  if (!q.explanation?.trim()) warnings.push("Missing explanation");
  if (!q.source?.trim()) warnings.push("Missing source");
  if (q.verified !== true) warnings.push("Not verified");

  return { valid: errors.length === 0, errors, warnings };
}

export function validateQuestionBank(list) {
  const questions = Array.isArray(list) ? list : [];
  const seen = new Set();
  const duplicates = [];

  const results = questions.map((q, index) => {
    const result = validateQuestion(q);
    const id = String(q?.id ?? "").trim();

    if (id && seen.has(id)) {
      duplicates.push(id);
      result.errors.push("Duplicate ID");
      result.valid = false;
    }
    if (id) seen.add(id);

    return { index: index + 1, id: id || "(missing)", ...result };
  });

  return {
    total: questions.length,
    validCount: results.filter(r => r.valid).length,
    invalidCount: results.filter(r => !r.valid).length,
    duplicateIds: [...new Set(duplicates)],
    results
  };
}

export function checkAnswer(q, selectedAnswer) {
  return Number(selectedAnswer) === Number(q.answer);
}
