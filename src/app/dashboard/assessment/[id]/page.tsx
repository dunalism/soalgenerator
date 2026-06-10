"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ReviewStep } from "@/components/dashboard/ReviewStep";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Loader2 } from "lucide-react";
import { useDialog } from "@/components/ui/dialog-provider";
import { Assessment, Question } from "@/lib/types";

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}

export default function AssessmentReviewPage({
  params,
  searchParams,
}: AssessmentPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const resolvedSearchParams = use(searchParams);
  const source = resolvedSearchParams.source;
  const { showAlert } = useDialog();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [initialQuestions, setInitialQuestions] = useState<Question[]>([]);

  // Fetch Assessment details on mount
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`/api/assessments/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal memuat asesmen.");
        }

        setAssessmentData(data.assessment);

        // Map backend schema to client-side Question interface
        const mappedQuestions: Question[] = data.assessment.questions.map(
          (q: Question) => ({
            id: q.id,
            questionText: q.questionText,
            type: q.type,
            options: q.options.map((opt) => ({
              id: opt.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            })),
            answerKey: q.answerKey,
          }),
        );

        setQuestions(mappedQuestions);
        setInitialQuestions(JSON.parse(JSON.stringify(mappedQuestions))); // Salinan murni untuk deteksi perubahan
      } catch (error) {
        const err = error as Error;
        console.error("Fetch error:", err);
        showAlert(
          "Gagal Memuat",
          err.message || "Terjadi kesalahan saat memuat data.",
        );
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, router, showAlert]);

  // Handle saving the updated questions list to the database (MySQL)
  const handleSaveToBankSoal = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/assessments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan.");
      }

      setInitialQuestions(JSON.parse(JSON.stringify(questions))); // Reset state perubahan
      showAlert(
        "Sukses",
        "Perubahan berhasil disimpan ke Bank Soal database MySQL!",
      );
    } catch (error) {
      const err = error as Error;
      console.error("Save error:", err);
      showAlert("Gagal Menyimpan", err.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Hitung apakah ada perubahan pada soal dibanding data awal di DB
  const hasChanges =
    JSON.stringify(questions) !== JSON.stringify(initialQuestions);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Memuat Data Asesmen dari Database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {source !== "bank-soal" && <ProgressBar currentStep="REVIEW" />}

      <ReviewStep
        questions={questions}
        setQuestions={setQuestions}
        title={assessmentData?.title || null}
        inputType={assessmentData?.inputType || "TEXT"}
        questionType={assessmentData?.questionType || ""}
        difficulty={assessmentData?.difficulty || ""}
        onBack={() => {
          if (source === "bank-soal") {
            router.push("/dashboard/bank-soal");
          } else {
            router.push("/dashboard");
          }
        }}
        onSaveToBankSoal={handleSaveToBankSoal}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />
    </div>
  );
}
