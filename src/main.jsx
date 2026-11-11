
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

import { questionService } from "./features/questions/questionService";
import { localStorageService } from "./services/storage/localStorageService";

const ALL_QUESTIONS = questionService.getAll();

const readStore = (key, fallback) =>
  localStorageService.get(key, fallback);

function App() {
  const [page, setPage] = useState("Dashboard");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);

  const [progress, setProgress] = useState(() =>
    readStore("practice-progress", {})
  );

  const [testAnswers, setTestAnswers] = useState({});
  const [testIndex, setTestIndex] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testTime, setTestTime] = useState(3600);
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

  const [mobileMenu, setMobileMenu] = useState(false);

  const questions = useMemo(
    () => ALL_QUESTIONS.filter(q => q.exam === "cg-vyapam"),
    []
  );

  const q = questions[practiceIndex % Math.max(questions.length, 1)];

  const attempted = Object.keys(progress).length;
  const correct = Object.values(progress).filter(Boolean).length;
  const accuracy = attempted
    ? Math.round((correct / attempted) * 100)
    : 0;

  useEffect(() => {
    localStorageService.set("practice-progress", progress);
  }, [progress]);

  useEffect(() => {
    localStorageService.set("study-plan", studyPlan);
  }, [studyPlan]);

  useEffect(() => {
    localStorageService.set("test-history", testHistory);
  }, [testHistory]);

  useEffect(() => {
    if (!testStarted || testSubmitted || testTime <= 0) return;

    const timer = setInterval(() => {
      setTestTime(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testSubmitted, testTime]);

  useEffect(() => {
    if (testStarted && testTime === 0 && !testSubmitted) {
      submitTest();
    }
  }, [testTime, testStarted, testSubmitted]);

  function navigate(name) {
    setPage(name);
    setMobileMenu(false);
    setSelected(null);
    setChecked(false);
  }

  function checkPractice() {
    if (selected === null || !q) return;

    setChecked(true);
    setProgress(prev => ({
      ...prev,
      [q.id]: Number(selected) === Number(q.answer)
    }));
  }

  function nextPractice() {
    setPracticeIndex(i => (i + 1) % Math.max(questions.length, 1));
    setSelected(null);
    setChecked(false);
  }

  function startTest() {
    setTestAnswers({});
    setTestIndex(0);
    setTestTime(3600);
    setTestSubmitted(false);
    setTestStarted(true);
  }

  function submitTest() {
    if (testSubmitted) return;

    const score = questions.reduce((sum, question, index) => {
      return sum + (
        Number(testAnswers[index]) === Number(question.answer) ? 1 : 0
      );
    }, 0);

    const result = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-IN"),
      total: questions.length,
      attempted: Object.keys(testAnswers).length,
      correct: score,
      accuracy: questions.length
        ? Math.round((score / questions.length) * 100)
        : 0
    };

    setTestHistory(prev => [result, ...prev]);
    setTestSubmitted(true);
    setTestStarted(false);
  }

  function resetProgress() {
    if (!window.confirm("क्या आप अपना Practice Progress reset करना चाहते हैं?")) return;
    setProgress({});
    localStorageService.remove("practice-progress");
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
          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
            ☰
          </button>
          <div className="exam-pill">🎓 CG Vyapam</div>
          <div className="top-tag">✨ Your Success Partner</div>
          <div className="top-spacer" />
          <span className="top-icon">🔔</span>
          <div className="avatar">S</div>
        </header>

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

        {page === "Practice" && (
          <section className="page-content">
            <PageHeading title="Practice Zone" subtitle="Learn • Practice • Improve" />
            <div className="practice-layout">
              <div className="panel question-panel">
                <div className="question-meta">
                  <span>Question {practiceIndex + 1}</span>
                  <span>{q?.subject || "General"} • CG Vyapam</span>
                </div>
                <h2>{q?.question || "Question bank में अभी प्रश्न उपलब्ध नहीं हैं।"}</h2>

                <div className="options">
                  {q?.options?.map((option, i) => (
                    <button
                      key={i}
                      className={`option ${selected === i ? "option-selected" : ""} ${
                        checked && i === q.answer ? "option-correct" : ""
                      } ${checked && selected === i && i !== q.answer ? "option-wrong" : ""}`}
                      onClick={() => !checked && setSelected(i)}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {option}
                    </button>
                  ))}
                </div>

                {checked && (
                  <div className={`answer-feedback ${selected === q.answer ? "good" : "bad"}`}>
                    {selected === q.answer ? "✓ सही उत्तर!" : "✕ गलत उत्तर"}
                    <p>{q?.explanation || "इस प्रश्न की explanation उपलब्ध नहीं है।"}</p>
                  </div>
                )}

                <div className="question-actions">
                  <button className="btn-secondary" onClick={nextPractice}>Skip →</button>
                  {!checked ? (
                    <button className="btn-primary" onClick={checkPractice}>Check Answer</button>
                  ) : (
                    <button className="btn-primary" onClick={nextPractice}>Next Question →</button>
                  )}
                </div>
              </div>

              <div className="panel side-info">
                <h3>📈 Practice Summary</h3>
                <div className="mini-stat"><span>Attempted</span><strong>{attempted}</strong></div>
                <div className="mini-stat"><span>Correct</span><strong>{correct}</strong></div>
                <div className="mini-stat"><span>Accuracy</span><strong>{accuracy}%</strong></div>
                <div className="progress-track"><div style={{width: `${accuracy}%`}} /></div>
              </div>
            </div>
          </section>
        )}

        {page === "Mock Test" && (
          <section className="page-content">
            <PageHeading title="Mock Test" subtitle="Test your preparation under exam conditions" />
            {!testStarted && !testSubmitted && (
              <div className="panel test-start">
                <div className="big-icon">📝</div>
                <h2>CG Vyapam Practice Test</h2>
                <p>{questions.length} questions • 60 minutes • Score analysis</p>
                <button className="btn-primary" onClick={startTest}>Start Mock Test →</button>
              </div>
            )}

            {testStarted && !testSubmitted && (
              <div className="panel question-panel">
                <div className="question-meta">
                  <span>Question {testIndex + 1}/{questions.length}</span>
                  <span className="timer">⏱ {Math.floor(testTime / 60)}:{String(testTime % 60).padStart(2, "0")}</span>
                </div>
                <h2>{questions[testIndex]?.question}</h2>
                <div className="options">
                  {questions[testIndex]?.options.map((option, i) => (
                    <button
                      key={i}
                      className={`option ${Number(testAnswers[testIndex]) === i ? "option-selected" : ""}`}
                      onClick={() => setTestAnswers(prev => ({...prev, [testIndex]: i}))}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>{option}
                    </button>
                  ))}
                </div>
                <div className="question-actions">
                  <button className="btn-secondary" onClick={() => setTestIndex(i => Math.max(0, i - 1))}>← Previous</button>
                  {testIndex < questions.length - 1 ? (
                    <button className="btn-primary" onClick={() => setTestIndex(i => i + 1)}>Next →</button>
                  ) : (
                    <button className="btn-primary" onClick={submitTest}>Submit Test</button>
                  )}
                </div>
                <button className="text-button" onClick={submitTest}>Finish test now</button>
              </div>
            )}

            {testSubmitted && (
              <div className="panel test-start">
                <div className="big-icon">🏆</div>
                <h2>Test Completed!</h2>
                <div className="result-score">
                  {testHistory[0]?.accuracy ?? 0}%
                </div>
                <p>Correct: {testHistory[0]?.correct ?? 0} / {questions.length}</p>
                <button className="btn-primary" onClick={startTest}>Retake Test</button>
              </div>
            )}
          </section>
        )}

        {page === "Revision" && (
          <section className="page-content">
            <PageHeading title="Revision Room" subtitle="Revise your weak areas and mistakes" />
            <div className="panel">
              <h2>📌 Questions to revise</h2>
              {questions.filter(question => progress[question.id] === false).length === 0
                ? <EmptyState text="अभी कोई गलत उत्तर नहीं है। Practice शुरू करें!" />
                : questions.filter(question => progress[question.id] === false).map(question => (
                  <div className="revision-item" key={question.id}>
                    <p>{question.question}</p>
                    <small>Correct answer: {question.options[question.answer]}</small>
                  </div>
                ))}
            </div>
          </section>
        )}

        {page === "Study Plan" && (
          <section className="page-content">
            <PageHeading title="Study Plan" subtitle="Build your daily study consistency" />
            <div className="panel plan-panel">
              <h2>Today's Checklist</h2>
              {studyPlan.map(item => (
                <label className={`plan-item ${item.done ? "plan-done" : ""}`} key={item.id}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => setStudyPlan(prev => prev.map(x =>
                      x.id === item.id ? {...x, done: !x.done} : x
                    ))}
                  />
                  <span>{item.text}</span>
                </label>
              ))}
              <div className="progress-track">
                <div style={{width: `${studyPlan.length ? studyPlan.filter(x => x.done).length / studyPlan.length * 100 : 0}%`}} />
              </div>
              <p>{studyPlan.filter(x => x.done).length} / {studyPlan.length} tasks completed</p>
            </div>
          </section>
        )}

        {page === "Progress" && (
          <section className="page-content">
            <PageHeading title="Your Progress" subtitle="Your learning journey at a glance" />
            <div className="stats-grid">
              <StatCard icon="📚" value={attempted} label="Attempted Questions" tone="blue" />
              <StatCard icon="✓" value={correct} label="Correct Answers" tone="green" />
              <StatCard icon="🎯" value={`${accuracy}%`} label="Accuracy" tone="purple" />
              <StatCard icon="📝" value={testHistory.length} label="Mock Tests" tone="orange" />
            </div>
            <div className="panel">
              <h2>Mock Test History</h2>
              {testHistory.length === 0 ? <EmptyState text="अभी कोई mock test नहीं दिया गया।" /> :
                testHistory.map(test => (
                  <div className="revision-item" key={test.id}>
                    <strong>{test.date}</strong>
                    <p>{test.correct}/{test.total} correct • {test.accuracy}% accuracy</p>
                  </div>
                ))}
              <button className="btn-secondary danger-button" onClick={resetProgress}>Reset Practice Progress</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Dashboard({navigate, questions, attempted, correct, accuracy, testHistory}) {
  const progressPercent = questions.length
    ? Math.round(attempted / questions.length * 100)
    : 0;

  return (
    <section className="page-content dashboard-content">
      <div className="hero-grid">
        <div className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">WELCOME TO YOUR STUDY SPACE</span>
            <h1>CG Exam <span>Saathi</span></h1>
            <p>Smart Preparation for CG Vyapam</p>
            <button className="btn-primary" onClick={() => navigate("Practice")}>Start Practicing →</button>
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
        <StatCard icon="🏆" value={accuracy >= 75 ? "Good" : "Growing"} label="Performance" tone="orange"/>
      </div>

      <h2 className="section-title">✨ Quick Access</h2>
      <div className="quick-grid">
        {[
          ["Practice","🎯","Topic-wise Questions","blue"],
          ["Mock Test","📝","Take Mock Test","purple"],
          ["Revision","↻","Weak Topics","green"],
          ["Study Plan","▦","Plan Your Study","orange"],
          ["Progress","📈","Track Your Progress","indigo"]
        ].map(([name,icon,desc,tone]) => (
          <button className={`quick-card ${tone}`} key={name} onClick={() => navigate(name)}>
            <span className="quick-icon">{icon}</span>
            <strong>{name}</strong>
            <small>{desc}</small>
            <span className="quick-arrow">→</span>
          </button>
        ))}
      </div>

      <div className="bottom-grid">
        <div className="panel progress-panel">
          <div className="panel-heading"><h2>Your Progress</h2><button onClick={() => navigate("Progress")}>View Details →</button></div>
          <div className="progress-content">
            <div className="progress-ring" style={{"--progress": `${progressPercent}%`}}>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="progress-details">
              <span>Overall Practice Progress</span>
              <div className="progress-track"><div style={{width: `${progressPercent}%`}}/></div>
              <p>✓ {correct} correct <span>•</span> ⏳ {attempted} attempted</p>
            </div>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading"><h2>Recent Activity</h2><button onClick={() => navigate("Progress")}>View All →</button></div>
          {testHistory.length ? (
            <div className="activity-row"><span>✓</span><div><strong>Mock Test Completed</strong><small>{testHistory[0].accuracy}% score</small></div></div>
          ) : (
            <div className="activity-row"><span>📖</span><div><strong>Welcome to CG Exam Saathi</strong><small>Start your first practice session</small></div></div>
          )}
          <div className="activity-row"><span>▶</span><div><strong>Practice Questions</strong><small>{attempted} questions attempted</small></div></div>
        </div>
      </div>
    </section>
  );
}

function PageHeading({title, subtitle}) {
  return <div className="page-heading"><h1>{title}</h1><p>{subtitle}</p></div>;
}

function StatCard({icon,value,label,tone}) {
  return <div className={`stat-card ${tone}`}><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function EmptyState({text}) {
  return <div className="empty-state"><span>🌱</span><p>{text}</p></div>;
}

createRoot(document.getElementById("root")).render(<App />);
