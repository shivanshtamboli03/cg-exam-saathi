
import data from "../../data/questions.json";

const questions = Array.isArray(data) ? data : data.questions || [];

export const questionRepository = {
  getAll: () => questions,

  getById: id =>
    questions.find(q => String(q.id) === String(id)),

  getByExam: examId =>
    questions.filter(q => q.exam === examId),

  getBySubject: subjectId =>
    questions.filter(q => q.subject === subjectId),

  getByTopic: topicId =>
    questions.filter(q => q.topic === topicId),

  getCount: () => questions.length
};
