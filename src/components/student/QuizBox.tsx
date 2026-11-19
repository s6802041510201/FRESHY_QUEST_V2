"use client";

// แบบฝึกท้ายคลิป (ไม่ใช่ข้อสอบวิจัย) ตรวจในเบราว์เซอร์ เฉลยพร้อมคำอธิบาย ผลล่าสุดจำในเครื่อง
import { useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import { clearQuizResult, gradeQuiz, saveQuizResult } from "@/lib/progress";
import type { QuizQuestion } from "@/lib/quest-types";
import { useProgress } from "@/lib/use-progress";
import { useI18n } from "@/lib/i18n/client";

export default function QuizBox({ mediaId, questions }: { mediaId: string; questions: QuizQuestion[] }) {
  const { t } = useI18n();
  const { progress, update } = useProgress();
  const saved = progress.quiz[mediaId];
  const [draft, setDraft] = useState<Record<string, string>>({});

  const submitted = !!saved;
  const answers = saved ? saved.answers : draft;
  const allAnswered = questions.every((q) => answers[q.id]);
  const result = submitted ? gradeQuiz(questions, answers) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!allAnswered || submitted) return;
        update((p) => saveQuizResult(p, mediaId, gradeQuiz(questions, draft)));
      }}
      className="space-y-6"
    >
      {questions.map((q, qi) => {
        const picked = answers[q.id];
        const correct = picked === q.answer;
        return (
          <fieldset key={q.id} className="min-w-0">
            <legend className="mb-3 font-semibold text-ink">
              {qi + 1}. {q.question}
            </legend>
            <div className="space-y-2.5">
              {q.choices.map((c) => {
                const id = `quiz-${mediaId}-${q.id}-${c.id}`;
                const isPicked = picked === c.id;
                const isAnswer = c.id === q.answer;
                let tone = "ring-line-strong bg-surface";
                if (submitted && isAnswer) tone = "ring-teal bg-teal/10";
                else if (submitted && isPicked) tone = "ring-red-strong bg-red/10";
                return (
                  <label
                    key={c.id}
                    htmlFor={id}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-4 py-3 ring-1 ${tone} ${
                      submitted ? "cursor-default" : "hover:bg-canvas"
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={`quiz-${mediaId}-${q.id}`}
                      value={c.id}
                      disabled={submitted}
                      checked={isPicked}
                      onChange={() => setDraft((d) => ({ ...d, [q.id]: c.id }))}
                      className="mt-1.5 size-5 shrink-0 accent-navy"
                    />
                    <span className="text-ink">
                      {c.text}
                      {submitted && isAnswer ? (
                        <span className="ml-2 text-sm font-semibold text-teal-strong">{t.quizBox.correctAnswer}</span>
                      ) : null}
                      {submitted && isPicked && !isAnswer ? (
                        <span className="ml-2 text-sm font-semibold text-red-strong">{t.quizBox.yourPick}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {submitted ? (
              <p
                role="status"
                className={`mt-2 text-sm ${correct ? "text-teal-strong" : "text-red-strong"}`}
              >
                <span className="font-semibold">{correct ? t.quizBox.right : t.quizBox.wrong}</span>
                {q.explanation ? <span className="text-muted"> · {q.explanation}</span> : null}
              </p>
            ) : null}
          </fieldset>
        );
      })}

      {result ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas p-4 ring-1 ring-line">
          <p className="font-medium text-ink" role="status">
            {t.quizBox.score(result.score, result.total)}
          </p>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setDraft({});
              update((p) => clearQuizResult(p, mediaId));
            }}
          >
            {t.quizBox.again}
          </button>
        </div>
      ) : (
        <div>
          <button type="submit" disabled={!allAnswered} className={btnPrimary}>
            {t.quizBox.check}
          </button>
          {!allAnswered ? <p className="mt-2 text-sm text-muted">{t.quizBox.answerAll}</p> : null}
        </div>
      )}
    </form>
  );
}
