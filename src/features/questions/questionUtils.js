
const SUBJECT_MAP = {
  computer: "computer",
  hindi: "hindi",
  english: "english",
  maths: "maths"
};

function getLegacyMetadata(id) {function getLegacyMetadata(id) {
  const textId = String(id ?? "").toUpperCase();

  if (textId.startsWith("CGV-COMP-")) {
    return {
      subject: "computer",
      topic: "computer-fundamentals"
    };
  }

  if (textId.startsWith("CGV-HIN-")) {
    return {
      subject: "hindi",
      topic: "hindi-grammar"
    };
  }

  if (textId.startsWith("CGV-ENG-")) {
    return {
      subject: "english",
      topic: "english-grammar"
    };
  }

  if (textId.startsWith("CGV-MATH-")) {
    return {
      subject: "maths",
      topic: "mathematics"
    };
  }

  const n = Number(id);

  // Computer questions: IDs 1–20
  if (n >= 1 && n <= 20) {
    const topics = {
      1: "internet-protocols",
      2: "internet-services",
      3: "cyber-security",
      4: "malware",
      5: "display-standards",
      6: "image-formats",
      7: "storage-units",
      8: "disk-structure",
      9: "operating-systems",
      10: "youtube",
      11: "robotics",
      12: "barcode",
      13: "motherboard",
      14: "software",
      15: "printers",
      16: "printers",
      17: "operating-systems",
      18: "operating-systems",
      19: "ms-office",
      20: "ms-word-formatting"
    };

    return {
      subject: SUBJECT_MAP.computer,
      topic: topics[n] || "computer-fundamentals"
    };
  }

  // Hindi questions: IDs 21–30
  if (n >= 21 && n <= 30) {
    const topics = {
      21: "hindi-alankar",
      22: "hindi-chhand",
      23: "hindi-upsarg",
      24: "hindi-tadbhav",
      25: "hindi-anekarthi",
      26: "hindi-paryayvachi",
      27: "hindi-varn-vichar",
      28: "hindi-sarvanam",
      29: "hindi-vakya-shuddhi",
      30: "hindi-sandhi"
    };

    return {
      subject: SUBJECT_MAP.hindi,
      topic: topics[n] || "hindi-grammar"
    };
  }

  // English questions: IDs 31–40
  if (n >= 31 && n <= 40) {
    const topics = {
      31: "english-voice",
      32: "english-narration",
      33: "english-spelling",
      34: "english-antonyms",
      35: "english-synonyms",
      36: "english-one-word-substitution",
      37: "english-gender",
      38: "english-pronouns",
      39: "english-conjunctions",
      40: "english-prepositions"
    };

    return {
      subject: SUBJECT_MAP.english,
      topic: topics[n] || "english-grammar"
    };
  }

  // Maths questions: IDs 41–42
  if (n >= 41 && n <= 42) {
    return {
      subject: SUBJECT_MAP.maths,
      topic: n === 41 ? "simple-interest" : "compound-interest"
    };
  }

  return { subject: "general", topic: "general" };
}

export function normalizeQuestion(question) {
  if (!question || typeof question !== "object") return null;

  const legacy = getLegacyMetadata(question.id);

  return {
    ...question,
    id: String(question.id ?? "").trim(),
    exam: question.exam || "cg-vyapam",
    subject: question.subject || legacy.subject,
    topic: question.topic || legacy.topic,
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
    return {
      valid: false,
      errors: ["Invalid question object"],
      warnings
    };
  }

  if (!String(q.id ?? "").trim()) errors.push("Missing ID");
  if (!q.question?.trim()) errors.push("Missing question text");

  if (!Array.isArray(q.options) || q.options.length < 2) {
    errors.push("At least 2 options required");
  } else if (
    q.options.some(o => typeof o !== "string" || !o.trim())
  ) {
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

  if (!q.exam?.trim()) errors.push("Missing exam");
  if (!q.subject?.trim()) errors.push("Missing subject");
  if (!q.topic?.trim()) errors.push("Missing topic");

  if (!["easy", "medium", "hard"].includes(q.difficulty)) {
    warnings.push("Invalid or missing difficulty");
  }

  if (!q.explanation?.trim()) warnings.push("Missing explanation");
  if (!q.source?.trim()) warnings.push("Missing source");
  if (q.verified !== true) warnings.push("Not verified");

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateQuestionBank(list) {
  const questions = Array.isArray(list) ? list : [];
  const seen = new Set();
  const duplicates = [];

  const results = questions.map((q, index) => {
    const normalized = normalizeQuestion(q);
    const result = validateQuestion(normalized);
    const id = String(q?.id ?? "").trim();

    if (id && seen.has(id)) {
      duplicates.push(id);
      result.errors.push("Duplicate ID");
      result.valid = false;
    }

    if (id) seen.add(id);

    return {
      index: index + 1,
      id: id || "(missing)",
      ...result
    };
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
