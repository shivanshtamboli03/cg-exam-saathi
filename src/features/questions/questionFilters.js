
import { questionService } from "./questionService";

const ALL_QUESTIONS = questionService.getAll();

export function getSubjects(exam = "cg-vyapam") {
  return [
    ...new Set(
      ALL_QUESTIONS
        .filter(q => q.exam === exam)
        .map(q => q.subject)
    )
  ];
}

export function getTopics(subject, exam = "cg-vyapam") {
  return [
    ...new Set(
      ALL_QUESTIONS
        .filter(q => q.exam === exam && q.subject === subject)
        .map(q => q.topic)
    )
  ];
}

export function filterQuestions({
  exam = "cg-vyapam",
  subject = "all",
  topic = "all",
  difficulty = "all",
  search = ""
} = {}) {
  return ALL_QUESTIONS.filter(q => {
    const subjectMatch =
      subject === "all" || q.subject === subject;

    const topicMatch =
      topic === "all" || q.topic === topic;

    const difficultyMatch =
      difficulty === "all" || q.difficulty === difficulty;

    const searchMatch =
      !search ||
      q.question.toLowerCase().includes(search.toLowerCase());

    return (
      q.exam === exam &&
      subjectMatch &&
      topicMatch &&
      difficultyMatch &&
      searchMatch
    );
  });
}
