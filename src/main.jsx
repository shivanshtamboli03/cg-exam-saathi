
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

import { questionService } from "./features/questions/questionService";
import { localStorageService } from "./services/storage/localStorageService";

const ALL_QUESTIONS = questionService.getAll();

const readStore = (key, fallback) =>
  localStorageService.get(key, fallback);

const formatTime = seconds =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const today = () => new Date().toISOString().slice(0, 10);

function App() {
  const [page, setPage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  // PRACTICE
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSubject, setPracticeSubject] = useState("all");
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  const [progress, setProgress] = useState(() =>
    readStore("practice-progress", {})
  );

  const [bookmarks, setBookmarks] = useState(() =>
    readStore("bookmarks", [])
  );

  // MOCK TEST
  const [testAnswers, setTestAnswers] = useState({});
  const [testIndex, setTestIndex] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testTime, setTestTime] = useState(3600);
  const [testHistory, setTestHistory] = useState(() =>
    readStore("test-history", [])
  );

  const [currentResult, setCurrentResult] = useState(null);

  // STUDY PLAN
  const [studyPlan, setStudyPlan] = useState(() =>
    readStore("study-plan", [
      { id: 1, text: "Computer Knowledge", done: false },
      { id: 2, text: "Chhattisgarh GK", done: false },
      { id: 3, text: "Reasoning Practice", done: false },
      { id: 4, text: "Mock Test", done: false }
    ])
  );

  const [newTask, setNewTask] = useState("");

  // QUESTION FILTER
  const questions = useMemo(
    () => ALL_QUESTIONS.filter(q =>
      q.exam === "cg-vyapam" && q.id && q.options?.length >= 2
    ),
    []
  );

  const subjects = useMemo(
    () => [...new Set(questions.map(q => q.subject || "General"))],
    [questions]
  );

  const practiceQuestions = useMemo(
    () => practiceSubject === "all"
      ? questions
      : questions.filter(q => q.subject === practiceSubject),
    [questions, practiceSubject]
  );

  const q = practiceQuestions.length
    ? practiceQuestions[practiceIndex % practiceQuestions.length]
    : null;

  const currentTestQuestion = questions[testIndex];

  // QA REPORT - DEVELOPMENT ONLY
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const report = questionService.getValidationReport();
    const quality = questionService.getQualitySummary();

    console.group("CG Exam Saathi | Question Engine QA");
    console.log("Question Quality:", quality);
    console.table(report.results);
    console.groupEnd();
  }, []);

  // PERSISTENCE
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

  // TIMER
  useEffect(() => {
    if (!testStarted || testSubmitted) return;

    const timer = setInterval(() => {
      setTestTime(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testSubmitted]);

  useEffect(() => {
    if (testStarted && testTime === 0 && !testSubmitted) {
      submitTest();
    }
  }, [testTime, testStarted, testSubmitted]);

  // ANALYTICS
  const attempted = Object.keys(progress).length;
  const correct = Object.values(progress).filter(Boolean).length;
  const accuracy = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  const testCount = testHistory.length;
  const averageTestAccuracy = testCount
    ? Math.round(
        testHistory.reduce((sum, t) => sum + t.accuracy, 0) / testCount
      )
    : 0;

  // NAVIGATION
  function navigate(name) {
    setPage(name);
    setMobileMenu(false);
    setSelected(null);
    setChecked(false);
  }

  // PRACTICE
  function checkPractice() {
    if (!q || selected === null) return;

    setChecked(true);
    setProgress(prev => ({
      ...prev,
      [q.id]: Number(selected) === Number(q.answer)
    }));
  }

  function nextPractice() {
    setPracticeIndex(i =>
      (i + 1) % Math.max(practiceQuestions.length, 1)
    );
    setSelected(null);
    setChecked(false);
  }

  function changeSubject(value) {
    setPracticeSubject(value);
    setPracticeIndex(0);
    setSelected(null);
    setChecked(false);
  }

  function toggleBookmark(question) {
    if (!question) return;

    setBookmarks(prev =>
      prev.includes(question.id)
        ? prev.filter(id => id !== question.id)
        : [...prev, question.id]
    );
  }

  // MOCK TEST
  function startTest() {
    if (!questions.length) {
      alert("Question bank में अभी प्रश्न उपलब्ध नहीं हैं।");
      return;
    }

    setTestAnswers({});
    setTestIndex(0);
    setTestTime(3600);
    setCurrentResult(null);
    setTestSubmitted(false);
    setTestStarted(true);
  }

  function submitTest() {
    if (testSubmitted || !testStarted) return;

    const total = questions.length;
    const attemptedCount = Object.keys(testAnswers).length;

    const correctCount = questions.reduce((sum, question, index) => {
      return sum +
        (Number(testAnswers[index]) === Number(question.answer) ? 1 : 0);
    }, 0);

    const wrongCount = attemptedCount - correctCount;
    const unattempted = total - attemptedCount;

    const result = {
      id: Date.now(),
      date: new Date().toLocaleString("en-IN"),
      total,
      attempted: attemptedCount,
      correct: correctCount,
      wrong: wrongCount,
      unattempted,
      accuracy: total
        ? Math.round((correctCount / total) * 100)
        : 0,
      timeUsed: 3600 - testTime
    };

    setCurrentResult(result);
    setTestHistory(prev => [result, ...prev]);
    setTestSubmitted(true);
    setTestStarted(false);
  }

  function resetPracticeProgress() {
    if (!window.confirm("क्या Practice Progress reset करना चाहते हैं?")) return;

    setProgress({});
    localStorageService.remove("practice-progress");
  }

  function resetAllData() {
    if (!window.confirm(
      "Practice, Bookmarks, Test History और Study Plan सभी reset होंगे। जारी रखें?"
    )) return;

    setProgress({});
    setBookmarks([]);
    setTestHistory([]);
    setCurrentResult(null);
    localStorageService.clearAll();
  }

  // STUDY PLAN
  function addTask() {
    if (!newTask.trim()) return;

    setStudyPlan(prev => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), done: false }
    ]);
    setNewTask("");
  }

  function toggleTask(id) {
    setStudyPlan(prev =>
      prev.map(item =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  }

  function removeTask(id) {
    setStudyPlan(prev => prev.filter(item => item.id !== id));
  }

  const navItems = [
    ["Dashboard", "⌂"],
    ["Practice", "✎"],
    ["Mock Test", "▣"],
    ["Revision", "↻"],
    ["Study Plan", "▤"],
    ["Progress", "▥"]
  ];

  return (
    <div className="app-shell">
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
              <span>{icon}</span>{name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span>🏆</span>
          <strong>Dream Big...</strong>
          <p>Crack CG Vyapam!</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenu(v => !v)}
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
            averageTestAccuracy={averageTestAccuracy}
          />
        )}

        {/* PRACTICE */}
        {page === "Practice" && (
          <section className="page-content">
            <PageHeading
              title="Practice Zone"
              subtitle="Learn • Practice • Improve"
            />

            <div className="panel" style={{ marginBottom: 18 }}>
              <label>
                Subject:&nbsp;
                <select
                  value={practiceSubject}
                  onChange={e => changeSubject(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="practice-layout">
              <div className="panel question-panel">
                {q ? (
                  <>
                    <div className="question-meta">
                      <span>
                        Question {practiceIndex + 1}/{practiceQuestions.length}
                      </span>
                      <span>{q.subject || "General"} • CG Vyapam</span>
                    </div>

                    <h2>{q.question}</h2>

                    <div className="options">
                      {q.options.map((option, i) => (
                        <button
                          key={i}
                          className={`option ${
                            selected === i ? "option-selected" : ""
                          } ${
                            checked && i === q.answer ? "option-correct" : ""
                          } ${
                            checked && selected === i && i !== q.answer
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

                    {checked && (
                      <div className={`answer-feedback ${
                        selected === q.answer ? "good" : "bad"
                      }`}>
                        {selected === q.answer ? "✓ सही उत्तर!" : "✕ गलत उत्तर"}
                        <p>{q.explanation || "Explanation उपलब्ध नहीं है।"}</p>
                      </div>
                    )}

                    <div className="question-actions">
                      <button className="btn-secondary" onClick={nextPractice}>
                        Skip →
                      </button>

                      {!checked ? (
                        <button
                          className="btn-primary"
                          onClick={checkPractice}
                          disabled={selected === null}
                        >
                          Check Answer
                        </button>
                      ) : (
                        <button className="btn-primary" onClick={nextPractice}>
                          Next Question →
                        </button>
                      )}
                    </div>

                    <button
                      className="text-button"
                      onClick={() => toggleBookmark(q)}
                    >
                      {bookmarks.includes(q.id)
                        ? "★ Remove Bookmark"
                        : "☆ Bookmark Question"}
                    </button>
                  </>
                ) : (
                  <EmptyState text="इस subject में अभी प्रश्न उपलब्ध नहीं हैं।" />
                )}
              </div>

              <div className="panel side-info">
                <h3>📈 Practice Summary</h3>
                <div className="mini-stat">
                  <span>Attempted</span><strong>{attempted}</strong>
                </div>
                <div className="mini-stat">
                  <span>Correct</span><strong>{correct}</strong>
                </div>
                <div className="mini-stat">
                  <span>Accuracy</span><strong>{accuracy}%</strong>
                </div>
                <div className="progress-track">
                  <div style={{ width: `${accuracy}%` }} />
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
                <p>{questions.length} questions • 60 minutes</p>
                <button className="btn-primary" onClick={startTest}>
                  Start Mock Test →
                </button>
              </div>
            )}

            {testStarted && currentTestQuestion && (
              <div className="panel question-panel">
                <div className="question-meta">
                  <span>Question {testIndex + 1}/{questions.length}</span>
                  <span className="timer">⏱ {formatTime(testTime)}</span>
                </div>

                <h2>{currentTestQuestion.question}</h2>

                <div className="options">
                  {currentTestQuestion.options.map((option, i) => (
                    <button
                      key={i}
                      className={`option ${
                        Number(testAnswers[testIndex]) === i
                          ? "option-selected"
                          : ""
                      }`}
                      onClick={() =>
                        setTestAnswers(prev => ({ ...prev, [testIndex]: i }))
                      }
                    >
                      <span>{String.fromCharCode(65 + i)}</span>{option}
                    </button>
                  ))}
                </div>

                <div className="question-actions">
                  <button
                    className="btn-secondary"
                    disabled={testIndex === 0}
                    onClick={() => setTestIndex(i => Math.max(0, i - 1))}
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
                    <button className="btn-primary" onClick={submitTest}>
                      Submit Test
                    </button>
                  )}
                </div>

                <div className="test-palette">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      className={`palette-item ${
                        testIndex === index ? "active" : ""
                      } ${
                        testAnswers[index] !== undefined ? "answered" : ""
                      }`}
                      onClick={() => setTestIndex(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button className="text-button" onClick={submitTest}>
                  Finish test now
                </button>
              </div>
            )}

            {testSubmitted && currentResult && (
              <div className="panel test-start">
                <div className="big-icon">🏆</div>
                <h2>Test Completed!</h2>
                <div className="result-score">{currentResult.accuracy}%</div>
                <p>
                  Correct: {currentResult.correct}/{currentResult.total}
                </p>
                <p>
                  Wrong: {currentResult.wrong} • Unattempted: {currentResult.unattempted}
                </p>
                <p>Attempted: {currentResult.attempted}</p>

                <button
                  className="btn-secondary"
                  onClick={() => navigate("Progress")}
                >
                  View Progress
                </button>
                <button className="btn-primary" onClick={startTest}>
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
              subtitle="Revise your mistakes and bookmarked questions"
            />

            <div className="panel">
              <h2>❌ Wrong Questions</h2>

              {questions.filter(q => progress[q.id] === false).length === 0
                ? <EmptyState text="अभी कोई गलत उत्तर नहीं है। Practice शुरू करें!" />
                : questions.filter(q => progress[q.id] === false).map(question => (
                    <div className="revision-item" key={question.id}>
                      <p>{question.question}</p>
                      <small>
                        Correct answer: {question.options[question.answer]}
                      </small>
                    </div>
                  ))}
            </div>

            <div className="panel" style={{ marginTop: 18 }}>
              <h2>⭐ Bookmarked Questions</h2>

              {questions.filter(q => bookmarks.includes(q.id)).length === 0
                ? <EmptyState text="अभी कोई bookmarked question नहीं है।" />
                : questions.filter(q => bookmarks.includes(q.id)).map(question => (
                    <div className="revision-item" key={question.id}>
                      <p>{question.question}</p>
                      <small>
                        Correct answer: {question.options[question.answer]}
                      </small>
                      <button
                        className="text-button"
                        onClick={() => toggleBookmark(question)}
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

              <div className="plan-add">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Add a study task..."
                />
                <button className="btn-primary" onClick={addTask}>
                  Add
                </button>
              </div>

              {studyPlan.map(item => (
                <div className={`plan-item ${item.done ? "plan-done" : ""}`} key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleTask(item.id)}
                    />
                    <span>{item.text}</span>
                  </label>
                  <button
                    className="text-button"
                    onClick={() => removeTask(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="progress-track">
                <div style={{
                  width: `${
                    studyPlan.length
                      ? studyPlan.filter(x => x.done).length / studyPlan.length * 100
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
              <StatCard icon="📚" value={attempted} label="Attempted Questions" tone="blue"/>
              <StatCard icon="✓" value={correct} label="Correct Answers" tone="green"/>
              <StatCard icon="🎯" value={`${accuracy}%`} label="Accuracy" tone="purple"/>
              <StatCard icon="📝" value={testCount} label="Mock Tests" tone="orange"/>
            </div>

            <div className="panel">
              <h2>Mock Test History</h2>

              {testHistory.length === 0
                ? <EmptyState text="अभी कोई mock test नहीं दिया गया।" />
                : testHistory.map(test => (
                    <div className="revision-item" key={test.id}>
                      <strong>{test.date}</strong>
                      <p>
                        {test.correct}/{test.total} correct • {test.accuracy}% accuracy
                      </p>
                      <small>
                        Attempted {test.attempted} • Wrong {test.wrong ?? 0} •
                        Unattempted {test.unattempted ?? 0}
                      </small>
                    </div>
                  ))}

              <button
                className="btn-secondary danger-button"
                onClick={resetPracticeProgress}
              >
                Reset Practice Progress
              </button>
            </div>

            <div className="panel" style={{ marginTop: 18 }}>
              <h2>Performance Overview</h2>
              <p>Practice accuracy: {accuracy}%</p>
              <p>Average mock test accuracy: {averageTestAccuracy}%</p>
              <p>Total bookmarked questions: {bookmarks.length}</p>
              <button className="btn-secondary danger-button" onClick={resetAllData}>
                Reset All Data
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Dashboard({
  navigate,
  questions,
  attempted,
  correct,
  accuracy,
  testHistory,
  averageTestAccuracy
}) {
  const progressPercent = questions.length
    ? Math.min(100, Math.round(attempted / questions.length * 100))
    : 0;

  return (
    <section className="page-content dashboard-content">
      <div className="hero-grid">
        <div className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">WELCOME TO YOUR STUDY SPACE</span>
            <h1>CG Exam <span>Saathi</span></h1>
            <p>Smart Preparation for CG Vyapam</p>
            <button className="btn-primary" onClick={() => navigate("Practice")}>
              Start Practicing →
            </button>
          </div>
          <div className="hero-art">📚<span>🎓</span></div>
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
        </div>

        <div className="motivation-card">
          <span>✦ DAILY MOTIVATION</span>
          <div className="quote-mark">“</div>
          <h2>You Can Do It!</h2>
          <p>Consistent Study<br/>Brings Success.</p>
          <div className="motivation-bottom">🔥 Keep Going!</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="📘" value={questions.length} label="Questions" tone="blue"/>
        <StatCard icon="📝" value={testHistory.length} label="Mock Tests" tone="green"/>
        <StatCard icon="📊" value={`${accuracy}%`} label="Your Accuracy" tone="purple"/>
        <StatCard icon="🏆" value={averageTestAccuracy + "%"} label="Mock Average" tone="orange"/>
      </div>

      <h2 className="section-title">✨ Quick Access</h2>
      <div className="quick-grid">
        {[
          ["Practice","🎯","Topic-wise Questions","blue"],
          ["Mock Test","📝","Take Mock Test","purple"],
          ["Revision","↻","Weak Questions","green"],
          ["Study Plan","▦","Plan Your Study","orange"],
          ["Progress","📈","Track Your Progress","indigo"]
        ].map(([name,icon,desc,tone]) => (
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

      <div className="bottom-grid">
        <div className="panel progress-panel">
          <div className="panel-heading">
            <h2>Your Progress</h2>
            <button onClick={() => navigate("Progress")}>View Details →</button>
          </div>

          <div className="progress-content">
            <div className="progress-ring" style={{"--progress": `${progressPercent}%`}}>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="progress-details">
              <span>Overall Practice Progress</span>
              <div className="progress-track">
                <div style={{width: `${progressPercent}%`}}/>
              </div>
              <p>✓ {correct} correct <span>•</span> ⏳ {attempted} attempted</p>
            </div>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <h2>Recent Activity</h2>
            <button onClick={() => navigate("Progress")}>View All →</button>
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

function PageHeading({title, subtitle}) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function StatCard({icon,value,label,tone}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div><strong>{value}</strong><span>{label}</span></div>
    </div>
  );
}

function EmptyState({text}) {
  return <div className="empty-state"><span>🌱</span><p>{text}</p></div>;
}

createRoot(document.getElementById("root")).render(<App />);
