
import { questionService } from "./questionService";

const questions = questionService.getAll();

export function getQuestionBankAnalytics() {
  const report = questionService.getValidationReport();
  const quality = questionService.getQualitySummary();

  const subjects = {};
  const topics = {};
  const exams = {};

  questions.forEach(question => {
    subjects[question.subject] =
      (subjects[question.subject] || 0) + 1;

    topics[question.topic] =
      (topics[question.topic] || 0) + 1;

    exams[question.exam] =
      (exams[question.exam] || 0) + 1;
  });

  return {
    totalQuestions: questions.length,
    validQuestions: questions.length - report.invalidCount,
    invalidQuestions: report.invalidCount,
    verifiedQuestions: quality.verified,
    missingExplanation: quality.missingExplanation,
    missingSource: quality.missingSource,
    subjects,
    topics,
    exams,
    duplicateIds: quality.duplicateIds
  };
}

export function getSubjectAnalytics(subject) {
  const filtered = questions.filter(q => q.subject === subject);

  return {
    subject,
    total: filtered.length,
    verified: filtered.filter(q => q.verified).length,
    topics: [...new Set(filtered.map(q => q.topic))],
    difficulty: {
      easy: filtered.filter(q => q.difficulty === "easy").length,
      medium: filtered.filter(q => q.difficulty === "medium").length,
      hard: filtered.filter(q => q.difficulty === "hard").length
    }
  };
}
