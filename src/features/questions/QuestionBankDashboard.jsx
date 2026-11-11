
import React, { useMemo } from "react";
import { getQuestionBankAnalytics } from "./questionAnalytics";
import { runQuestionBankQA } from "./questionBankQA";

export default function QuestionBankDashboard() {
  const analytics = useMemo(() => getQuestionBankAnalytics(), []);
  const qa = useMemo(() => runQuestionBankQA(), []);

  return (
    <section className="page-content">
      <div className="page-heading">
        <h1>Question Bank QA</h1>
        <p>Question quality and content statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div><strong>{analytics.totalQuestions}</strong>
          <span>Total Questions</span></div>
        </div>

        <div className="stat-card green">
          <div><strong>{analytics.validQuestions}</strong>
          <span>Valid Questions</span></div>
        </div>

        <div className="stat-card purple">
          <div><strong>{analytics.verifiedQuestions}</strong>
          <span>Verified Questions</span></div>
        </div>

        <div className="stat-card orange">
          <div><strong>{analytics.invalidQuestions}</strong>
          <span>Invalid Questions</span></div>
        </div>
      </div>

      <div className="panel">
        <h2>Subject Distribution</h2>

        {Object.entries(analytics.subjects).map(([subject, count]) => (
          <div className="revision-item" key={subject}>
            <strong>{subject}</strong>
            <p>{count} questions</p>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Question Quality</h2>

        <p>Missing Explanation: {analytics.missingExplanation}</p>
        <p>Missing Source: {analytics.missingSource}</p>
        <p>Duplicate IDs: {analytics.duplicateIds.length}</p>

        <div className="answer-feedback">
          {qa.passed
            ? "✓ Structural QA Passed"
            : "⚠️ Issues Found"}
        </div>
      </div>

      {qa.issues.length > 0 && (
        <div className="panel">
          <h2>Detected Issues</h2>

          {qa.issues.map((issue, index) => (
            <div className="revision-item" key={index}>
              <strong>{issue.id || issue.status}</strong>
              <pre>{JSON.stringify(issue, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
