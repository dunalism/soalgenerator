"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useDialog } from "@/components/ui/dialog-provider";
import CbtLayout from "@/components/cbt/CbtLayout";
import CbtTimer from "@/components/cbt/CbtTimer";
import QuestionNavigation from "@/components/cbt/QuestionNavigation";
import {
  RefreshCw,
  Send,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Question } from "@/lib/types";

interface ExamData {
  examId: string;
  title: string;
  token: string;
  duration: number;
  startTime: string;
  endTime: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions: Question[];
}

interface StudentSession {
  name: string;
  studentId: string;
  token: string;
  startedAt: number;
}

interface AnswerState {
  optionId?: string;
  answerText?: string;
  isDoubtful?: boolean;
}

// Seeded shuffle to make it persistent on page refresh
function shuffleArrayWithSeed<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let currentIndex = arr.length,
    temporaryValue,
    randomIndex;

  // Simple seed-based random generator
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) {
    seedNum += seed.charCodeAt(i);
  }

  const random = () => {
    const x = Math.sin(seedNum++) * 10000;
    return x - Math.floor(x);
  };

  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = arr[currentIndex];
    arr[currentIndex] = arr[randomIndex];
    arr[randomIndex] = temporaryValue;
  }

  return arr;
}

export default function CbtExamPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);
  const { showAlert, showConfirm } = useDialog();

  const [student, setStudent] = useState<StudentSession | null>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jitterTime, setJitterTime] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize and load data from localStorage
  useEffect(() => {
    // Gunakan setTimeout 0 agar asinkron dan mencegah render beruntun sinkron di React Effect
    const timer = setTimeout(() => {
      try {
        const savedSession = localStorage.getItem(
          `cbt-student-session-${token}`,
        );
        const savedExam = localStorage.getItem(`cbt-exam-data-${token}`);

        if (!savedSession || !savedExam) {
          router.push("/cbt");
          return;
        }

        const parsedSession: StudentSession = JSON.parse(savedSession);
        const parsedExam: ExamData = JSON.parse(savedExam);

        setStudent(parsedSession);
        setExam(parsedExam);

        // Handle question shuffling if requested by teacher
        let finalQuestions = [...parsedExam.questions];
        if (parsedExam.shuffleQuestions) {
          // Shuffle using seed from student name/id to keep it consistent on page refresh
          const seed = parsedSession.name + parsedSession.studentId;
          finalQuestions = shuffleArrayWithSeed(finalQuestions, seed);
        }
        setQuestions(finalQuestions);

        // Load saved answers from localStorage if any
        const savedAnswers = localStorage.getItem(`cbt-answers-${token}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading CBT data:", err);
        router.push("/cbt");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [token, router]);

  // Save answers state to localStorage on every change
  const saveAnswer = (questionId: string, newState: Partial<AnswerState>) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          ...newState,
        },
      };
      localStorage.setItem(`cbt-answers-${token}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleDoubtful = (questionId: string) => {
    const currentDoubtful = !!answers[questionId]?.isDoubtful;
    saveAnswer(questionId, { isDoubtful: !currentDoubtful });
  };

  // Submitting the Exam
  const performSubmission = async () => {
    if (!student || !exam) return;

    setSubmitting(true);
    setSubmitError(null);

    // Prepare payload in the format specified by CBT Roadmap (Tahap 5)
    const formattedAnswers = questions.map((q) => {
      const ans = answers[q.id];
      return {
        questionId: q.id,
        chosenOptionId: ans?.optionId || null,
        textAnswer: ans?.answerText || null,
      };
    });

    const payload = {
      studentName: student.name,
      studentId: student.studentId,
      examToken: token,
      answers: formattedAnswers,
    };

    // Calculate Jitter (0 to 15 seconds)
    const jitterSeconds = Math.floor(Math.random() * 15);
    setJitterTime(jitterSeconds);

    // Countdown the jitter queue visually
    for (let i = jitterSeconds; i >= 0; i--) {
      setJitterTime(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    try {
      const response = await fetch("/api/exams/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Gagal menyimpan lembar jawaban.");
      }

      // Success! Clear local storage for this exam session
      localStorage.removeItem(`cbt-student-session-${token}`);
      localStorage.removeItem(`cbt-exam-data-${token}`);
      localStorage.removeItem(`cbt-timer-${token}`);
      localStorage.removeItem(`cbt-answers-${token}`);

      showAlert(
        "Ujian Selesai",
        "Lembar jawaban Anda berhasil dikirim dan disimpan dengan aman. Terima kasih!",
      );
      router.push("/cbt/success");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setSubmitError(
        errMsg ||
          "Gagal terhubung ke server. Lembar jawaban Anda tetap aman disimpan di laptop ini.",
      );
      showAlert(
        "Koneksi Gagal",
        "Sistem tidak dapat terhubung ke server untuk mengirimkan nilai. Lembar jawaban Anda telah di-backup dengan aman di browser ini. Silakan hubungi pengawas atau klik 'Kirim Ulang' setelah koneksi pulih.",
      );
    } finally {
      setSubmitting(false);
      setJitterTime(null);
    }
  };

  const handleSubmitClick = () => {
    // Check if there are unanswered questions
    const unansweredCount = questions.filter((q) => {
      const ans = answers[q.id];
      return (
        !ans ||
        (!ans.optionId && (!ans.answerText || ans.answerText.trim() === ""))
      );
    }).length;

    const extraMsg =
      unansweredCount > 0
        ? `Masih ada ${unansweredCount} soal yang belum Anda jawab. `
        : "";

    showConfirm(
      "Selesaikan Ujian?",
      `${extraMsg}Apakah Anda yakin ingin mengakhiri sesi ujian ini? Setelah dikirim, Anda tidak dapat mengubah jawaban lagi.`,
      performSubmission,
    );
  };

  const handleExitToCbtMain = () => {
    router.push("/cbt");
  };

  if (loading || !student || !exam) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2 font-medium">
          Memuat Ujian...
        </p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers[currentQuestion.id] || {};

  return (
    <CbtLayout
      title={exam.title}
      studentName={student.name}
      studentId={student.studentId}
      onExit={handleExitToCbtMain}
      timerComponent={
        <CbtTimer
          durationMinutes={exam.duration}
          token={token}
          startedAt={student.startedAt}
          onTimeUp={performSubmission}
        />
      }
    >
      {/* JITTERING / LOADING OVERLAY */}
      {jitterTime !== null && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm text-center space-y-4">
            <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h3 className="text-lg font-bold">Mengirim Lembar Jawaban</h3>
            <p className="text-sm text-muted-foreground">
              Sedang mengantre menyimpan lembar jawaban secara aman ke database
              server...
            </p>
            <div className="bg-muted p-3 rounded-lg border text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
              Estimasi tersisa: {jitterTime} detik
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Question and Options (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {submitError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-sm flex gap-3 items-start">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Gagal Mengirim Jawaban</p>
                <p className="text-muted-foreground text-xs">{submitError}</p>
                <Button
                  size="xs"
                  variant="destructive"
                  className="mt-2 font-semibold h-7"
                  onClick={performSubmission}
                  disabled={submitting}
                >
                  <Send className="h-3 w-3 mr-1" /> Kirim Ulang Sekarang
                </Button>
              </div>
            </div>
          )}

          <Card className="border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3.5 px-4 bg-muted/20">
              <span className="font-mono font-bold text-sm tracking-wider text-muted-foreground uppercase">
                Pertanyaan {currentIdx + 1} dari {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="doubtful-checkbox"
                  checked={!!currentAnswer.isDoubtful}
                  onCheckedChange={() =>
                    handleToggleDoubtful(currentQuestion.id)
                  }
                />
                <label
                  htmlFor="doubtful-checkbox"
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer uppercase select-none"
                >
                  Ragu-ragu
                </label>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Question Text rendering */}
              <div
                className="text-foreground text-base md:text-lg leading-relaxed font-medium prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.questionText,
                }}
              />

              {/* Answers Inputs according to Question Type */}
              <div className="pt-4 border-t border-dashed">
                {currentQuestion.type === "MULTIPLE_CHOICE" && (
                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const label = String.fromCharCode(65 + idx); // A, B, C, D...
                      const isSelected = currentAnswer.optionId === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            saveAnswer(currentQuestion.id, { optionId: opt.id })
                          }
                          className={`flex items-center gap-4 text-left border rounded-xl p-3.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div
                            className={`size-7 rounded-lg border font-mono font-bold flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            {label}
                          </div>
                          <span
                            className="text-sm sm:text-base font-semibold prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: opt.optionText }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "TRUE_FALSE" && (
                  <div className="grid grid-cols-2 gap-4">
                    {["Benar", "Salah"].map((val) => {
                      const isSelected = currentAnswer.answerText === val;

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            saveAnswer(currentQuestion.id, { answerText: val })
                          }
                          className={`py-4 px-6 text-base font-bold border rounded-xl flex items-center justify-center gap-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary text-primary"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div
                            className={`size-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-primary"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && (
                              <div className="size-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span>{val}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === "SHORT_ANSWER" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Tuliskan Jawaban Esai Anda
                    </label>
                    <Textarea
                      placeholder="Masukkan jawaban lengkap di sini..."
                      value={currentAnswer.answerText || ""}
                      onChange={(e) =>
                        saveAnswer(currentQuestion.id, {
                          answerText: e.target.value,
                        })
                      }
                      className="min-h-32 text-base"
                    />
                  </div>
                )}

                {currentQuestion.type === "MATCHING" && (
                  <MatchingSelector
                    question={currentQuestion}
                    value={currentAnswer.answerText || ""}
                    onChange={(textValue: string) =>
                      saveAnswer(currentQuestion.id, {
                        answerText: textValue,
                      })
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              className="font-semibold h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Sebelumnya
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="font-semibold h-9"
              >
                Selanjutnya <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={handleSubmitClick}
                className="bg-green-600 hover:bg-green-700 text-white font-bold h-9"
                disabled={submitting}
              >
                <Send className="h-4 w-4 mr-1.5" /> Selesaikan Ujian
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Question Grid Navigation (4 cols) */}
        <div className="lg:col-span-4">
          <QuestionNavigation
            questions={questions}
            currentQuestionIndex={currentIdx}
            onSelectQuestion={setCurrentIdx}
            answers={answers}
          />
        </div>
      </div>
    </CbtLayout>
  );
}
