
import questionsData from "../../data/questions.json";

const questions = Array.isArray(questionsData)
  ? questionsData
  : questionsData.questions || [];

export const questionRepository = {
  getAll() {
    return questions;
  },

  getById(id) {
    return questions.find(
      (question) => String(question.id) === String(id)
    );
  },

  getByExam(examId) {
    return questions.filter(
      (question) => question.exam === examId
    );
  },

  getBySubject(subjectId) {
    return questions.filter(
      (question) => question.subject === subjectId
    );
  },

  getByTopic(topicId) {
    return questions.filter(
      (question) => question.topic === topicId
    );
  },

  getCount() {
    return questions.length;
  }
};
