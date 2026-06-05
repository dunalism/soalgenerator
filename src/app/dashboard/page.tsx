"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { InputStep } from "@/components/dashboard/InputStep";
import { ConfigStep } from "@/components/dashboard/ConfigStep";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { Loader2 } from "lucide-react";
import { useDialog } from "@/components/ui/dialog-provider";

export default function DashboardPage() {
  const router = useRouter();
  const { showAlert } = useDialog();
  const [step, setStep] = useState<"INPUT" | "CONFIG">("INPUT");
  const [isGenerating, setIsGenerating] = useState(false);

  // State Step 1: Input Materi
  const [inputType, setInputType] = useState<"TEXT" | "IMAGE">("TEXT");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // State Step 2: Konfigurasi
  const [questionType, setQuestionType] = useState<string>("MULTIPLE_CHOICE");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("MEDIUM");

  // Function to create assessment draft in database and redirect to dynamic review page
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showAlert(
          "Sesi Habis",
          "Sesi Anda telah habis. Silakan login kembali.",
        );
        router.push("/login");
        return;
      }

      // 1. Call POST /api/assessments to save/generate in MySQL
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          inputType,
          rawInputText:
            inputType === "TEXT" ? rawText : selectedFile?.name || "",
          imageUrl: imagePreview || "",
          questionType,
          questionCount,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat asesmen.");
      }

      // 2. Redirect Guru to the persistent Review subroute
      router.push(`/dashboard/assessment/${data.id}`);
    } catch (error: unknown) {
      console.error("Generate error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showAlert(
        "Gagal Membuat Soal",
        errorMessage || "Terjadi kesalahan saat memproses materi.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <p className="font-bold text-lg">Menyusun Soal dengan AI...</p>
          <p className="text-sm text-muted-foreground">
            Sistem sedang membaca materi Anda dan merumuskan soal kustom di
            database MySQL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <ProgressBar currentStep={step} />

      {step === "INPUT" && (
        <InputStep
          inputType={inputType}
          setInputType={setInputType}
          rawText={rawText}
          setRawText={setRawText}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          onNext={() => setStep("CONFIG")}
        />
      )}

      {step === "CONFIG" && (
        <ConfigStep
          questionType={questionType}
          setQuestionType={setQuestionType}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onBack={() => setStep("INPUT")}
          onGenerate={handleGenerateQuestions}
        />
      )}
    </div>
  );
}
