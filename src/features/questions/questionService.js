
import { questionRepository } from "./questionRepository";
import {
  normalizeQuestion,
  isValidQuestion,
  validateQuestionBank
} from "./questionUtils";

export const questionService = {
  getAll() {
    return questionRepository.getAll()
      .map(normalizeQuestion)
      .filter(Boolean);
  },

  getByExam(examId) {
    return this.getAll().filter(q => q.exam === examId);
  },

  getBySubject(subjectId) {
    return this.getAll().filter(q => q.subject === subjectId);
  },

  getValidQuestions() {
    return this.getAll().filter(isValidQuestion);
  },

  getVerifiedQuestions() {
    return this.getAll().filter(q => q.verified && isValidQuestion(q));
  },

  getCount() {
    return this.getAll().length;
  },

  getValidCount() {
    return this.getValidQuestions().length;
  },

  getVerifiedCount() {
    return this.getVerifiedQuestions().length;
  },

  getValidationReport() {
    return validateQuestionBank(this.getAll());
  },

  getQualitySummary() {
    const questions = this.getAll();
    const report = validateQuestionBank(questions);

    return {
      total: questions.length,
      valid: report.validCount,
      invalid: report.invalidCount,
      verified: this.getVerifiedCount(),
      missingExplanation: questions.filter(q => !q.explanation.trim()).length,
      missingSource: questions.filter(q => !q.source.trim()).length,
      duplicateIds: report.duplicateIds
    };
  }
};
