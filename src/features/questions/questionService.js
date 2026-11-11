
import { questionRepository } from "./questionRepository";
import {
  normalizeQuestion,
  isValidQuestion
} from "./questionUtils";

export const questionService = {
  getAll() {
    return questionRepository
      .getAll()
      .map(normalizeQuestion);
  },

  getByExam(examId) {
    return this.getAll().filter(
      (question) => question.exam === examId
    );
  },

  getBySubject(subjectId) {
    return this.getAll().filter(
      (question) => question.subject === subjectId
    );
  },

  getValidQuestions() {
    return this.getAll().filter(isValidQuestion);
  },

  getCount() {
    return this.getAll().length;
  },

  getValidCount() {
    return this.getValidQuestions().length;
  }
};
