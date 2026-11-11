
import { questionService } from "./questionService";
import { getQuestionBankAnalytics } from "./questionAnalytics";

export function runQuestionBankQA() {
  const validation = questionService.getValidationReport();
  const analytics = getQuestionBankAnalytics();

  const issues = [];

  validation.results.forEach(result => {
    if (!result.valid) {
      issues.push({
        id: result.id,
        status: "INVALID",
        errors: result.errors
      });
    }
  });

  if (analytics.duplicateIds.length > 0) {
    issues.push({
      status: "DUPLICATE IDS",
      ids: analytics.duplicateIds
    });
  }

  return {
    timestamp: new Date().toISOString(),
    passed: issues.length === 0,
    analytics,
    issues
  };
}
