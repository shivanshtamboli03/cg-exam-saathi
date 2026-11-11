
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

import { questionService } from "./features/questions/questionService";
import { localStorageService } from "./services/storage/localStorageService";

import {
  filterQuestions,
  getSubjects,
  getTopics
} from "./features/questions/questionFilters";

import QuestionBankDashboard from "./features/questions/QuestionBankDashboard";

const ALL_QUESTIONS = questionService.getAll();

const readStore = (key, fallback) =>
  localStorageService.get(key, fallback);

function App() {
  // Navigation
  const [page, setPage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Practice
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [questionSearch, setQuestionSearch] = useState("");

  // Persistent data
  const [progress, setProgress] = useState(() =>
    readStore("practice-progress", {})
  );

  const [bookmarks, setBookmarks] = useState(() =>
    readStore("bookmarks", [])
  );

  const [testHistory, setTestHistory] = useState(() =>
    readStore("test-history", [])
  );

  const [studyPlan, setStudyPlan] = useState(() =>
    readStore("study-plan", [
      { id: 1, text: "Computer Knowledge", done: false },
      { id: 2, text: "Chhattisgarh GK", done: false },
      { id: 3, text: "Reasoning Practice", done: false },
      { id: 4, text: "Mock Test", done: false }
    ])
  );

  // Mock Test
  const [testAnswers, setTestAnswers] = useState({});
  const [testIndex, setTestIndex] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testTime, setTestTime] = useState(3600);
  const [currentResult, setCurrentResult] = useState(null);

  // Question Bank
  const questions = useMemo(
    () => ALL_QUESTIONS.filter(q => q.exam === "cg-vyapam"),
    []
  );

  // Practice Filtering
  const practiceQuestions = useMemo(() => {
    return filterQuestions({
      exam: "cg-vyapam",
      subject: subjectFilter,
      topic: topicFilter,
      difficulty: difficultyFilter,
      search: questionSearch
    });
  }, [
    subjectFilter,
    topicFilter,
    difficultyFilter,
    questionSearch
  ]);

  const availableSubjects = getSubjects();

  const availableTopics =
    subjectFilter === "all"
      ? []
      : getTopics(subjectFilter);

  const q = practiceQuestions.length
    ? practiceQuestions[
        practiceIndex % practiceQuestions.length
      ]
    : null;

  // Statistics
  const attempted = Object.keys(progress).length;

  const correct = Object.values(progress)
    .filter(Boolean).length;

  const accuracy = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  const wrongQuestions = questions.filter(
    question => progress[question.id] === false
  );

  const bookmarkedQuestions = questions.filter(
    question => bookmarks.includes(String(question.id))
  );

  // Question Engine QA - Development Console
  if (import.meta.env.DEV) {
    const report = questionService.getValidationReport();
    const quality = questionService.getQualitySummary();

    console.group("CG Exam Saathi | Question Engine QA");
    console.log("Question Quality:", quality);
    console.table(report.results);

    if (report.invalidCount > 0) {
      console.error("Invalid Questions:", report.invalidCount);
    } else {
      console.log("Question Structure: PASS");
    }

    console.groupEnd();
  }

  // Save data
  useEffect(() => {
    localStorageService.set("practice-progress", progress);
  }, [progress]);

  useEffect(() => {
    localStorageService.set("bookmarks", bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    localStorageService.set("study-plan", studyPlan);
  }, [studyPlan]);

  useEffect(() => {
    localStorageService.set("test-history", testHistory);
  }, [testHistory]);

  // Mock Test Timer
  useEffect(() => {
    if (!testStarted || testSubmitted) return;

    const timer = setInterval(() => {
      setTestTime(time => Math.max(0, time - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testSubmitted]);

  // Auto submit when timer finishes
  useEffect(() => {
    if (testStarted && testTime === 0 && !testSubmitted) {
      submitTest();
    }
  }, [testTime, testStarted, testSubmitted]);

  // Navigation
  function navigate(name) {
    setPage(name);
    setMobileMenu(false);
    setSelected(null);
    setChecked(false);
  }

  // Practice
  function checkPractice() {
    if (selected === null || !q) return;

    setChecked(true);

    setProgress(prev => ({
      ...prev,
      [q.id]: Number(selected) === Number(q.answer)
    }));
  }

  function nextPractice() {
    setPracticeIndex(index =>
      (index + 1) % Math.max(practiceQuestions.length, 1)
    );

    setSelected(null);
    setChecked(false);
  }

  function toggleBookmark(questionId) {
    const id = String(questionId);

    setBookmarks(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }

  function resetPracticeFilters() {
    setSubjectFilter("all");
    setTopicFilter("all");
    setDifficultyFilter("all");
    setQuestionSearch("");
    setPracticeIndex(0);
    setSelected(null);
    setChecked(false);
  }

  // Mock Test
  function startTest() {
    if (!questions.length) return;

    setTestAnswers({});
    setTestIndex(0);
    setTestTime(3600);
    setCurrentResult(null);
    setTestSubmitted(false);
    setTestStarted(true);
  }

  function submitTest() {
    if (testSubmitted || questions.length === 0) return;

    const attemptedCount = Object.keys(testAnswers).length;

    const score = questions.reduce((sum, question, index) => {
      return sum + (
        Number(testAnswers[index]) === Number(question.answer)
          ? 1
          : 0
      );
    }, 0);

    const result = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-IN"),
      total: questions.length,
      attempted: attemptedCount,
      correct: score,
      wrong: attemptedCount - score,
      skipped: questions.length - attemptedCount,
      accuracy: Math.round((score / questions.length) * 100)
    };

    setCurrentResult(result);
    setTestHistory(prev => [result, ...prev]);
    setTestSubmitted(true);
    setTestStarted(false);
  }

  // Reset
  function resetProgress() {
    if (!window.confirm(
      "क्या आप अपना Practice Progress reset करना चाहते हैं?"
    )) return;

    setProgress({});
    localStorageService.remove("practice-progress");
  }

  function resetAllData() {
    if (!window.confirm(
      "क्या आप सभी Practice, Bookmark और Study Plan data reset करना चाहते हैं?"
    )) return;

    setProgress({});
    setBookmarks([]);
    setTestHistory([]);

    setStudyPlan([
      { id: 1, text: "Computer Knowledge", done: false },
      { id: 2, text: "Chhattisgarh GK", done: false },
      { id: 3, text: "Reasoning Practice", done: false },
      { id: 4, text: "Mock Test", done: false }
    ]);

    localStorageService.remove("practice-progress");
    localStorageService.remove("bookmarks");
    localStorageService.remove("test-history");
    localStorageService.remove("study-plan");
  }

  // Navigation Items
  const navItems = [
    ["Dashboard", "⌂"],
    ["Practice", "✎"],
    ["Mock Test", "▣"],
    ["Revision", "↻"],
    ["Study Plan", "▤"],
    ["Progress", "▥"],
    ["Question Bank", "📚"]
  ];

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">📚</div>
          <h2>CG Exam<br />Saathi</h2>
          <p>Study • Practice • Success</p>
        </div>

        <nav>
          {navItems.map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => navigate(name)}
            >
              <span>{icon}</span>
              {name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span>🏆</span>
          <strong>Dream Big...</strong>
          <p>Crack CG Vyapam!</p>
        </div>

      </aside>

      {/* MAIN */}
      <main className="main-area">

        {/* TOPBAR */}
        <header className="topbar">

          <button
            className="mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            ☰
          </button>

          <div className="exam-pill">🎓 CG Vyapam</div>
          <div className="top-tag">✨ Your Success Partner</div>

          <div className="top-spacer" />

          <span className="top-icon">🔔</span>
          <div className="avatar">S</div>

        </header>

        {/* DASHBOARD */}
        {page === "Dashboard" && (
          <Dashboard
            navigate={navigate}
            questions={questions}
            attempted={attempted}
            correct={correct}
            accuracy={accuracy}
            testHistory={testHistory}
          />
        )}

        {/* PRACTICE */}
        {page === "Practice" && (
          <section className="page-content">

            <PageHeading
              title="Practice Zone"
              subtitle="Learn • Practice • Improve"
            />

            {/* FILTERS */}
            <div className="practice-filters">

              <select
                value={subjectFilter}
                onChange={e => {
                  setSubjectFilter(e.target.value);
                  setTopicFilter("all");
                  setPracticeIndex(0);
                  setSelected(null);
                  setChecked(false);
                }}
              >
                <option value="all">All Subjects</option>

                {availableSubjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                value={topicFilter}
                onChange={e => {
                  setTopicFilter(e.target.value);
                  setPracticeIndex(0);
                  setSelected(null);
                  setChecked(false);
                }}
              >
                <option value="all">All Topics</option>

                {availableTopics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>

              <select
                value={difficultyFilter}
                onChange={e => {
                  setDifficultyFilter(e.target.value);
                  setPracticeIndex(0);
                  setSelected(null);
                  setChecked(false);
                }}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <input
                type="search"
                placeholder="Search questions..."
                value={questionSearch}
                onChange={e => {
                  setQuestionSearch(e.target.value);
                  setPracticeIndex(0);
                  setSelected(null);
                  setChecked(false);
                }}
              />

              <span>
                {practiceQuestions.length} Questions Available
              </span>

              <button
                className="btn-secondary"
                onClick={resetPracticeFilters}
              >
                Reset Filters
              </button>

            </div>

            <div className="practice-layout">

              {/* QUESTION */}
              <div className="panel question-panel">

                <div className="question-meta">
                  <span>
                    Question {practiceQuestions.length
                      ? practiceIndex + 1
                      : 0}
                  </span>

                  <span>
                    {q?.subject || "General"} • CG Vyapam
                  </span>
                </div>

                <h2>
                  {q?.question ||
                    "इस filter में कोई प्रश्न उपलब्ध नहीं है।"}
                </h2>

                {/* OPTIONS */}
                <div className="options">
                  {q?.options?.map((option, i) => (
                    <button
                      key={i}
                      className={`option ${
                        selected === i ? "option-selected" : ""
                      } ${
                        checked && i === q.answer
                          ? "option-correct"
                          : ""
                      } ${
                        checked &&
                        selected === i &&
                        i !== q.answer
                          ? "option-wrong"
                          : ""
                      }`}
                      onClick={() => !checked && setSelected(i)}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {option}
                    </button>
                  ))}
                </div>

                {/* FEEDBACK */}
                {checked && q && (
                  <div className={`answer-feedback ${
                    selected === q.answer ? "good" : "bad"
                  }`}>
                    {selected === q.answer
                      ? "✓ सही उत्तर!"
                      : "✕ गलत उत्तर"}

                    <p>
                      {q.explanation ||
                        "इस प्रश्न की explanation उपलब्ध नहीं है।"}
                    </p>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="question-actions">

                  <button
                    className="btn-secondary"
                    onClick={() => q && toggleBookmark(q.id)}
                    disabled={!q}
                  >
                    {q && bookmarks.includes(String(q.id))
                      ? "★ Bookmarked"
                      : "☆ Bookmark"}
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={nextPractice}
                    disabled={!practiceQuestions.length}
                  >
                    Skip →
                  </button>

                  {!checked ? (
                    <button
                      className="btn-primary"
                      onClick={checkPractice}
                      disabled={!q || selected === null}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={nextPractice}
                    >
                      Next Question →
                    </button>
                  )}

                </div>

              </div>

              {/* SUMMARY */}
              <div className="panel side-info">

                <h3>📈 Practice Summary</h3>

                <div className="mini-stat">
                  <span>Attempted</span>
                  <strong>{attempted}</strong>
                </div>

                <div className="mini-stat">
                  <span>Correct</span>
                  <strong>{correct}</strong>
                </div>

                <div className="mini-stat">
                  <span>Accuracy</span>
                  <strong>{accuracy}%</strong>
                </div>

                <div className="progress-track">
                  <div style={{ width: `${accuracy}%` }} />
                </div>

                <div className="mini-stat">
                  <span>Bookmarks</span>
                  <strong>{bookmarks.length}</strong>
                </div>

                <div className="mini-stat">
                  <span>Wrong Questions</span>
                  <strong>{wrongQuestions.length}</strong>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* MOCK TEST */}
        {page === "Mock Test" && (
          <section className="page-content">

            <PageHeading
              title="Mock Test"
              subtitle="Test your preparation under exam conditions"
            />

            {!testStarted && !testSubmitted && (
              <div className="panel test-start">

                <div className="big-icon">📝</div>
                <h2>CG Vyapam Practice Test</h2>

                <p>
                  {questions.length} questions • 60 minutes • Score analysis
                </p>

                <button
                  className="btn-primary"
                  onClick={startTest}
                  disabled={!questions.length}
                >
                  Start Mock Test →
                </button>

              </div>
            )}

            {/* TEST QUESTIONS */}
            {testStarted && !testSubmitted && (
              <div className="panel question-panel">

                <div className="question-meta">

                  <span>
                    Question {testIndex + 1}/{questions.length}
                  </span>

                  <span className="timer">
                    ⏱ {Math.floor(testTime / 60)}:
                    {String(testTime % 60).padStart(2, "0")}
                  </span>

                </div>

                {/* QUESTION PALETTE */}
                <div className="test-palette">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      className={`palette-item ${
                        testAnswers[index] !== undefined
                          ? "answered"
                          : ""
                      } ${
                        testIndex === index ? "current" : ""
                      }`}
                      onClick={() => setTestIndex(index)}
                      title={`Question ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <h2>{questions[testIndex]?.question}</h2>

                <div className="options">
                  {questions[testIndex]?.options.map((option, i) => (
                    <button
                      key={i}
                      className={`option ${
                        Number(testAnswers[testIndex]) === i
                          ? "option-selected"
                          : ""
                      }`}
                      onClick={() => setTestAnswers(prev => ({
                        ...prev,
                        [testIndex]: i
                      }))}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {option}
                    </button>
                  ))}
                </div>

                <div className="question-actions">

                  <button
                    className="btn-secondary"
                    onClick={() => setTestIndex(i => Math.max(0, i - 1))}
                    disabled={testIndex === 0}
                  >
                    ← Previous
                  </button>

                  {testIndex < questions.length - 1 ? (
                    <button
                      className="btn-primary"
                      onClick={() => setTestIndex(i => i + 1)}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={submitTest}
                    >
                      Submit Test
                    </button>
                  )}

                </div>

                <button
                  className="text-button"
                  onClick={submitTest}
                >
                  Finish test now
                </button>

              </div>
            )}

            {/* TEST RESULT */}
            {testSubmitted && currentResult && (
              <div className="panel test-start">

                <div className="big-icon">🏆</div>
                <h2>Test Completed!</h2>

                <div className="result-score">
                  {currentResult.accuracy}%
                </div>

                <p>
                  Correct: {currentResult.correct}/{currentResult.total}
                </p>

                <div className="result-breakdown">

                  <div>
                    <strong>{currentResult.correct}</strong>
                    <span>Correct</span>
                  </div>

                  <div>
                    <strong>{currentResult.wrong}</strong>
                    <span>Wrong</span>
                  </div>

                  <div>
                    <strong>{currentResult.skipped}</strong>
                    <span>Skipped</span>
                  </div>

                </div>

                <p>
                  Attempted: {currentResult.attempted}/{currentResult.total}
                </p>

                <button
                  className="btn-primary"
                  onClick={startTest}
                >
                  Retake Test
                </button>

              </div>
            )}

          </section>
        )}

        {/* REVISION */}
        {page === "Revision" && (
          <section className="page-content">

            <PageHeading
              title="Revision Room"
              subtitle="Revise your weak areas and mistakes"
            />

            {/* WRONG QUESTIONS */}
            <div className="panel">

              <h2>📌 Questions to Revise</h2>

              {wrongQuestions.length === 0 ? (
                <EmptyState text="अभी कोई गलत उत्तर नहीं है। Practice शुरू करें!" />
              ) : (
                wrongQuestions.map(question => (
                  <div className="revision-item" key={question.id}>

                    <p>{question.question}</p>

                    <small>
                      Correct Answer: {question.options[question.answer]}
                    </small>

                    <p>{question.explanation}</p>

                  </div>
                ))}

            </div>

            {/* BOOKMARKED QUESTIONS */}
            <div className="panel revision-bookmarks">

              <h2>⭐ Bookmarked Questions</h2>

              {bookmarkedQuestions.length === 0 ? (
                <EmptyState text="अभी कोई bookmarked question नहीं है।" />
              ) : (
                bookmarkedQuestions.map(question => (
                  <div className="revision-item" key={question.id}>

                    <p>{question.question}</p>

                    <small>
                      Correct Answer: {question.options[question.answer]}
                    </small>

                    <p>{question.explanation}</p>

                    <button
                      className="btn-secondary"
                      onClick={() => toggleBookmark(question.id)}
                    >
                      Remove Bookmark
                    </button>

                  </div>
                ))}

            </div>

          </section>
        )}

        {/* STUDY PLAN */}
        {page === "Study Plan" && (
          <section className="page-content">

            <PageHeading
              title="Study Plan"
              subtitle="Build your daily study consistency"
            />

            <div className="panel plan-panel">

              <h2>Today's Checklist</h2>

              {studyPlan.map(item => (
                <label
                  className={`plan-item ${
                    item.done ? "plan-done" : ""
                  }`}
                  key={item.id}
                >

                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => setStudyPlan(prev =>
                      prev.map(x =>
                        x.id === item.id
                          ? { ...x, done: !x.done }
                          : x
                      )
                    )}
                  />

                  <span>{item.text}</span>

                </label>
              ))}

              <div className="progress-track">
                <div style={{
                  width: `${
                    studyPlan.length
                      ? studyPlan.filter(x => x.done).length /
                        studyPlan.length * 100
                      : 0
                  }%`
                }} />
              </div>

              <p>
                {studyPlan.filter(x => x.done).length} / {studyPlan.length} tasks completed
              </p>

            </div>

          </section>
        )}

        {/* PROGRESS */}
        {page === "Progress" && (
          <section className="page-content">

            <PageHeading
              title="Your Progress"
              subtitle="Your learning journey at a glance"
            />

            <div className="stats-grid">

              <StatCard
                icon="📚"
                value={attempted}
                label="Attempted Questions"
                tone="blue"
              />

              <StatCard
                icon="✓"
                value={correct}
                label="Correct Answers"
                tone="green"
              />

              <StatCard
                icon="🎯"
                value={`${accuracy}%`}
                label="Accuracy"
                tone="purple"
              />

              <StatCard
                icon="📝"
                value={testHistory.length}
                label="Mock Tests"
                tone="orange"
              />

            </div>

            {/* TEST HISTORY */}
            <div className="panel">

              <h2>Mock Test History</h2>

              {testHistory.length === 0 ? (
                <EmptyState text="अभी कोई mock test नहीं दिया गया।" />
              ) : (
                testHistory.map(test => (
                  <div className="revision-item" key={test.id}>

                    <strong>{test.date}</strong>

                    <p>
                      {test.correct}/{test.total} correct • {test.accuracy}% accuracy
                    </p>

                    <p>
                      Attempted: {test.attempted} • Wrong: {test.wrong ?? 0} • Skipped: {test.skipped ?? 0}
                    </p>

                  </div>
                ))
              )}

              <button
                className="btn-secondary danger-button"
                onClick={resetProgress}
              >
                Reset Practice Progress
              </button>

              <button
                className="btn-secondary danger-button"
                onClick={resetAllData}
              >
                Reset All Data
              </button>

            </div>

          </section>
        )}

        {/* QUESTION BANK */}
        {page === "Question Bank" && (
          <QuestionBankDashboard />
        )}

      </main>

    </div>
  );
}

// DASHBOARD
function Dashboard({
  navigate,
  questions,
  attempted,
  correct,
  accuracy,
  testHistory
}) {
  const progressPercent = questions.length
    ? Math.round(attempted / questions.length * 100)
    : 0;

  return (
    <section className="page-content dashboard-content">

      <div className="hero-grid">

        <div className="hero-card">

          <div className="hero-copy">

            <span className="eyebrow">
              WELCOME TO YOUR STUDY SPACE
            </span>

            <h1>CG Exam <span>Saathi</span></h1>

            <p>Smart Preparation for CG Vyapam</p>

            <button
              className="btn-primary"
              onClick={() => navigate("Practice")}
            >
              Start Practicing →
            </button>

          </div>

          <div className="hero-art">
            📚<span>🎓</span>
          </div>

          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />

        </div>

        <div className="motivation-card">

          <span>✦ DAILY MOTIVATION</span>

          <div className="quote-mark">“</div>

          <h2>You Can Do It!</h2>

          <p>Consistent Study<br />Brings Success.</p>

          <div className="motivation-bottom">
            🔥 Keep Going!
          </div>

        </div>

      </div>

      {/* STATS */}
      <div className="stats-grid">

        <StatCard
          icon="📘"
          value={questions.length}
          label="Questions"
          tone="blue"
        />

        <StatCard
          icon="📝"
          value={testHistory.length}
          label="Mock Tests"
          tone="green"
        />

        <StatCard
          icon="📊"
          value={`${accuracy}%`}
          label="Your Accuracy"
          tone="purple"
        />

        <StatCard
          icon="🏆"
          value={accuracy >= 75 ? "Good" : "Growing"}
          label="Performance"
          tone="orange"
        />

      </div>

      {/* QUICK ACCESS */}
      <h2 className="section-title">✨ Quick Access</h2>

      <div className="quick-grid">

        {[
          ["Practice", "🎯", "Topic-wise Questions", "blue"],
          ["Mock Test", "📝", "Take Mock Test", "purple"],
          ["Revision", "↻", "Weak Topics", "green"],
          ["Study Plan", "▦", "Plan Your Study", "orange"],
          ["Progress", "📈", "Track Your Progress", "indigo"],
          ["Question Bank", "📚", "Question Quality", "blue"]
        ].map(([name, icon, desc, tone]) => (
          <button
            className={`quick-card ${tone}`}
            key={name}
            onClick={() => navigate(name)}
          >

            <span className="quick-icon">{icon}</span>
            <strong>{name}</strong>
            <small>{desc}</small>
            <span className="quick-arrow">→</span>

          </button>
        ))}

      </div>

      {/* BOTTOM GRID */}
      <div className="bottom-grid">

        <div className="panel progress-panel">

          <div className="panel-heading">

            <h2>Your Progress</h2>

            <button onClick={() => navigate("Progress")}>
              View Details →
            </button>

          </div>

          <div className="progress-content">

            <div
              className="progress-ring"
              style={{ "--progress": `${progressPercent}%` }}
            >
              <strong>{progressPercent}%</strong>
            </div>

            <div className="progress-details">

              <span>Overall Practice Progress</span>

              <div className="progress-track">
                <div style={{ width: `${progressPercent}%` }} />
              </div>

              <p>
                ✓ {correct} correct <span>•</span> ⏳ {attempted} attempted
              </p>

            </div>

          </div>

        </div>

        {/* ACTIVITY */}
        <div className="panel activity-panel">

          <div className="panel-heading">

            <h2>Recent Activity</h2>

            <button onClick={() => navigate("Progress")}>
              View All →
            </button>

          </div>

          {testHistory.length ? (
            <div className="activity-row">

              <span>✓</span>

              <div>
                <strong>Mock Test Completed</strong>
                <small>{testHistory[0].accuracy}% score</small>
              </div>

            </div>
          ) : (
            <div className="activity-row">

              <span>📖</span>

              <div>
                <strong>Welcome to CG Exam Saathi</strong>
                <small>Start your first practice session</small>
              </div>

            </div>
          )}

          <div className="activity-row">

            <span>▶</span>

            <div>
              <strong>Practice Questions</strong>
              <small>{attempted} questions attempted</small>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

// PAGE HEADING
function PageHeading({ title, subtitle }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

// STAT CARD
function StatCard({ icon, value, label, tone }) {
  return (
    <div className={`stat-card ${tone}`}>

      <div className="stat-icon">{icon}</div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>

    </div>
  );
}

// EMPTY STATE
function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <span>🌱</span>
      <p>{text}</p>
    </div>
  );
}

// RENDER
createRoot(document.getElementById("root")).render(<App />);
