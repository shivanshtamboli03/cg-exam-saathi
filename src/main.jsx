
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import questions from "./data/questions.json";

function App() {
  const [page, setPage] = useState("Dashboard");
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState({});

  // Demo Test States
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});
  const [remaining, setRemaining] = useState(3600);

  const q = questions[idx];
  const score = Object.values(done).filter(Boolean).length;

  // Timer
  useEffect(() => {
    if (page !== "Test" || !testStarted || testSubmitted) return;

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setTestSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [page, testStarted, testSubmitted]);

  const time = 
    String(Math.floor(remaining / 60)).padStart(2, "0") +
    ":" +
    String(remaining % 60).padStart(2, "0");

  const testScore = questions.filter(
    question => testAnswers[question.id] === question.answer
  ).length;

  const attempted = Object.keys(testAnswers).length;

  const accuracy = attempted
    ? Math.round((testScore / attempted) * 100)
    : 0;

  function startTest() {
    setIdx(0);
    setTestAnswers({});
    setRemaining(3600);
    setTestSubmitted(false);
    setTestStarted(true);
  }

  function submitTest() {
    setTestSubmitted(true);
  }

  function next() {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      setChoice(null);
      setChecked(false);
    }
  }

  function previous() {
    if (idx > 0) {
      setIdx(idx - 1);
      setChoice(null);
      setChecked(false);
    }
  }

  function check() {
    if (choice === null) return;
    setChecked(true);
    setDone(d => ({ ...d, [q.id]: choice === q.answer }));
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo">CG</span>
          <div>
            <b>CG Exam Saathi</b>
            <small>LEARN • PRACTICE • REVISE</small>
          </div>
        </div>

        <nav>
          {["Dashboard", "Practice", "Revision", "Study Plan", "Progress"].map(x =>
            <button
              className={page === x ? "active" : ""}
              onClick={() => setPage(x)}
              key={x}
            >
              {x}
            </button>
          )}
        </nav>

        <div className="sidebottom">
          Prototype v0.3<br />
          <span>Demo Test Enabled</span>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <span className="eyebrow">CHHATTISGARH EXAM PREPARATION</span>
            <h1>{page}</h1>
          </div>
          <span className="tag">PATWARI • DEMO</span>
        </header>

        {/* DASHBOARD */}
        {page === "Dashboard" && <>
          <section className="welcome">
            <div>
              <span className="eyebrow">YOUR STUDY SPACE</span>
              <h2>Small steps. Strong preparation.</h2>
              <p>Practice Chhattisgarh-focused questions and review your progress.</p>

              <button className="primary" onClick={() => setPage("Practice")}>
                Start Practice →
              </button>

              <button className="primary" onClick={() => setPage("Test")}>
                Start Demo Test →
              </button>
            </div>
            <div className="heroicon">📚</div>
          </section>

          <div className="stats">
            <article><small>Total questions</small><strong>{questions.length}</strong></article>
            <article><small>Attempted practice</small><strong>{Object.keys(done).length}</strong></article>
            <article><small>Correct practice</small><strong>{score}</strong></article>
          </div>

          <section className="panel">
            <h3>Quick access</h3>
            <div className="quick">
              <button onClick={() => setPage("Practice")}>📝 Practice questions</button>
              <button onClick={() => setPage("Test")}>🧪 Demo Test</button>
              <button onClick={() => setPage("Revision")}>🔁 Revision queue</button>
              <button onClick={() => setPage("Study Plan")}>🗓️ Study plan</button>
            </div>
          </section>
        </>}

        {/* PRACTICE MODE */}
        {page === "Practice" && q && <>
          <section className="panel practice">
            <span className="tag">QUESTION {idx + 1}/{questions.length}</span>
            <h2 className="question">{q.question}</h2>

            <div className="options">
              {q.options.map((o, i) =>
                <button
                  key={i}
                  className={"option " +
                    (choice === i ? "selected " : "") +
                    (checked && i === q.answer ? "correct" : "")}
                  onClick={() => !checked && setChoice(i)}
                >
                  {String.fromCharCode(65 + i)}. {o}
                </button>
              )}
            </div>

            {checked && <div className={"feedback " + (choice === q.answer ? "good" : "bad")}>
              <b>{choice === q.answer ? "Correct!" : "Not quite."}</b>
              <p>{q.explanation}</p>
            </div>}

            <div className="row actions">
              <button onClick={previous} disabled={idx === 0}>← Previous</button>

              {!checked
                ? <button className="primary" onClick={check}>Check Answer</button>
                : <button className="primary" onClick={next}>Next Question →</button>
              }
            </div>
          </section>
        </>}

        {page === "Practice" && !q && <section className="panel">
          No questions available. Check questions.json.
        </section>}

        {/* DEMO TEST */}
        {page === "Test" && !testStarted && <section className="panel">
          <h2>Patwari Demo Test</h2>
          <p>Total Questions: {questions.length}</p>
          <p>Time Limit: 60 Minutes</p>
          <p>Answers will not be shown during the test.</p>
          <button className="primary" onClick={startTest}>Begin Test →</button>
        </section>}

        {page === "Test" && testStarted && !testSubmitted && q && <>
          <section className="panel practice">
            <div className="row">
              <span className="tag">QUESTION {idx + 1}/{questions.length}</span>
              <span className="tag">⏱ {time}</span>
            </div>

            <h2 className="question">{q.question}</h2>

            <div className="options">
              {q.options.map((o, i) =>
                <button
                  key={i}
                  className={"option " +
                    (testAnswers[q.id] === i ? "selected" : "")}
                  onClick={() =>
                    setTestAnswers(a => ({ ...a, [q.id]: i }))
                  }
                >
                  {String.fromCharCode(65 + i)}. {o}
                </button>
              )}
            </div>

            <div className="row actions">
              <button onClick={previous} disabled={idx === 0}>
                ← Previous
              </button>

              <button onClick={next} disabled={idx === questions.length - 1}>
                Next →
              </button>

              <button className="primary" onClick={submitTest}>
                Submit Test
              </button>
            </div>
          </section>
        </>}

        {/* TEST RESULT */}
        {page === "Test" && testSubmitted && <section className="panel">
          <h2>Test Result 🎉</h2>

          <div className="stats">
            <article><small>Total Score</small><strong>{testScore}/{questions.length}</strong></article>
            <article><small>Attempted</small><strong>{attempted}</strong></article>
            <article><small>Accuracy</small><strong>{accuracy}%</strong></article>
          </div>

          <p>Unattempted: {questions.length - attempted}</p>

          <button className="primary" onClick={startTest}>
            Retake Test
          </button>

          <button onClick={() => setPage("Dashboard")}>
            Dashboard
          </button>
        </section>}

        {/* REVISION */}
        {page === "Revision" && <section className="panel">
          <h2>Revision Queue</h2>
          <p className="muted">Questions you get wrong can appear here later.</p>
          <div className="empty">🔁<br />Your revision list will appear here.</div>
        </section>}

        {/* STUDY PLAN */}
        {page === "Study Plan" && <section className="panel">
          <h2>Today's Study Plan</h2>
          <div className="planitem"><b>25 min</b><span>Study one Chhattisgarh GK topic</span></div>
          <div className="planitem"><b>20 min</b><span>Practice questions</span></div>
          <div className="planitem"><b>10 min</b><span>Review mistakes</span></div>
        </section>}

        {/* PRACTICE PROGRESS */}
        {page === "Progress" && <section className="panel">
          <h2>Your Practice Progress</h2>
          <div className="stats">
            <article><small>Attempted</small><strong>{Object.keys(done).length}</strong></article>
            <article><small>Correct</small><strong>{score}</strong></article>
            <article><small>Accuracy</small><strong>{Object.keys(done).length ? Math.round(score / Object.keys(done).length * 100) : 0}%</strong></article>
          </div>
          <button onClick={() => {setDone({}); setIdx(0); setChoice(null); setChecked(false);}}>
            Reset Practice Progress
          </button>
        </section>}

        <footer>CG Exam Saathi • Prototype • Verify official answers before publishing.</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
