
import { questionService } from "./questionService";

export function runQuestionValidation() {
  const report = questionService.getValidationReport();
  const quality = questionService.getQualitySummary();

  console.group("CG Exam Saathi — Question Bank QA");
  console.table(quality);

  report.results
    .filter(q => !q.valid)
    .forEach(q => console.error(q.id, q.errors));

  report.results
    .filter(q => q.warnings.length)
    .forEach(q => console.warn(q.id, q.warnings));

  console.log("Validation:", report);
  console.groupEnd();

  return report;
}
