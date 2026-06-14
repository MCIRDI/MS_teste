export const VETTING_PASS_SCORE = 60;
export const VETTING_RETRY_DAYS = 7;

export type VettingQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

export const vettingQuestions: VettingQuestion[] = [
  {
    id: "q1",
    prompt: "What should you include in a high-quality bug report?",
    options: [
      { id: "a", label: "Only a screenshot without steps" },
      { id: "b", label: "Clear steps, expected vs actual result, and environment details" },
      { id: "c", label: "A one-word title" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q2",
    prompt: "When testing a checkout flow, what is the best approach?",
    options: [
      { id: "a", label: "Test only the happy path once" },
      { id: "b", label: "Try valid and invalid inputs, edge cases, and different devices" },
      { id: "c", label: "Skip payment methods to save time" },
    ],
    correctOptionId: "b",
  },
  {
    id: "q3",
    prompt: "How should you classify a crash that blocks all users?",
    options: [
      { id: "a", label: "LOW" },
      { id: "b", label: "MEDIUM" },
      { id: "c", label: "CRITICAL" },
    ],
    correctOptionId: "c",
  },
  {
    id: "q4",
    prompt: "What environment information is useful for reproducibility?",
    options: [
      { id: "a", label: "Device, OS version, browser, and network context" },
      { id: "b", label: "Only your first name" },
      { id: "c", label: "Nothing — developers will guess" },
    ],
    correctOptionId: "a",
  },
  {
    id: "q5",
    prompt: "If you find the same bug another tester already reported, you should:",
    options: [
      { id: "a", label: "Submit it again with more detail if you have new evidence" },
      { id: "b", label: "Spam duplicate reports to earn more" },
      { id: "c", label: "Never report similar issues" },
    ],
    correctOptionId: "a",
  },
];

export function scoreVettingAnswers(answers: Record<string, string>) {
  let correct = 0;
  for (const question of vettingQuestions) {
    if (answers[question.id] === question.correctOptionId) {
      correct += 1;
    }
  }

  const score = Math.round((correct / vettingQuestions.length) * 100);
  return { score, passed: score >= VETTING_PASS_SCORE };
}

export function canRetryVetting(retryDate: Date | null | undefined) {
  if (!retryDate) {
    return true;
  }
  return retryDate.getTime() <= Date.now();
}
