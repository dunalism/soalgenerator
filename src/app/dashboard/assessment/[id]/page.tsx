"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ReviewStep } from "@/components/dashboard/ReviewStep";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Question } from "@/components/dashboard/QuestionCard";
import { Loader2 } from "lucide-react";

interface DBQuestion {
  id: string;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: {
    id: string;
    optionText: string;
    isCorrect: boolean;
  }[];
  answerKey: string;
}

interface AssessmentData {
  inputType: "TEXT" | "IMAGE";
  questionType: string;
  difficulty: string;
}

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
}

export default function AssessmentReviewPage({ params }: AssessmentPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(
    null,
  );
  const [questions, setQuestions] = useState<Question[]>([]);

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
          (q: DBQuestion) => ({
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
      } catch (error) {
        const err = error as Error;
        console.error("Fetch error:", err);
        alert(err.message || "Terjadi kesalahan saat memuat data.");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, router]);

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

      alert("Asesmen berhasil disimpan ke Bank Soal database MySQL!");
    } catch (error) {
      const err = error as Error;
      console.error("Save error:", err);
      alert(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

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
      <ProgressBar currentStep="REVIEW" />

      <ReviewStep
        questions={questions}
        setQuestions={setQuestions}
        inputType={assessmentData?.inputType || "TEXT"}
        questionType={assessmentData?.questionType || ""}
        difficulty={assessmentData?.difficulty || ""}
        onBack={() => router.push("/dashboard")}
        onSaveToBankSoal={handleSaveToBankSoal}
        isSaving={isSaving}
      />
    </div>
  );
}
