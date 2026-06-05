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
  const [loadingText, setLoadingText] = useState("Menyusun Soal dengan AI...");

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
  // Fungsi untuk kompres gambar menggunakan Canvas
  const compressImage = (
    file: File,
    maxWidth = 1200,
    quality = 0.7,
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Pertahankan aspect ratio, tapi batasi lebar maksimal
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Ubah menjadi Blob dengan format jpeg dan kualitas yang dikurangi (0.7)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Canvas to Blob gagal"));
            },
            "image/jpeg",
            quality,
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    let finalInputText = rawText;

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

      // If image input, run Tesseract OCR client-side first!
      if (inputType === "IMAGE") {
        if (!selectedFile) {
          showAlert(
            "Gambar Kosong",
            "Silakan unggah gambar materi pelajaran terlebih dahulu.",
          );
          setIsGenerating(false);
          return;
        }

        setLoadingText("Membaca teks dari gambar menggunakan OCR...");

        try {
          let fileToProcess: File | Blob = selectedFile;

          // 1. Jika ukuran file lebih dari 1MB, kompres dulu di browser
          if (selectedFile.size > 1024 * 1024) {
            try {
              fileToProcess = await compressImage(selectedFile, 1200, 0.7);
              console.log(
                "Gambar berhasil dikompres dari:",
                selectedFile.size,
                "ke:",
                fileToProcess.size,
              );
            } catch (compressError) {
              console.error(
                "Gagal mengompres gambar, lanjut pakai file asli:",
                compressError,
              );
            }
          }

          // 2. Jalankan Tesseract menggunakan file yang sudah ringan
          const Tesseract = (await import("tesseract.js")).default;
          const ocrResult = await Tesseract.recognize(fileToProcess, "ind+eng");
          finalInputText = ocrResult.data.text;

          if (!finalInputText || finalInputText.trim().length < 10) {
            showAlert(
              "Gagal Membaca",
              "Gagal mendeteksi teks dari gambar materi pelajaran. Silakan unggah gambar materi pelajaran dengan tulisan yang lebih jelas.",
            );
            setIsGenerating(false);
            return;
          }

          // 3. SEBELUM fetch ke /api/assessments:
          // Pastikan Anda HANYA mengirimkan `finalInputText` ke backend,
          // BUKAN mengirimkan file asli `selectedFile` atau Base64 raksasanya ke database!
        } catch (ocrError) {
          console.error("Client OCR Error:", ocrError);
          showAlert(
            "Gagal Membaca Gambar",
            "Terjadi kesalahan saat memproses gambar menggunakan OCR. Silakan coba lagi atau gunakan metode Salin & Tempel Teks.",
          );
          setIsGenerating(false);
          return;
        }
      }

      setLoadingText("Menyusun Soal kustom dengan AI...");

      // 1. Call POST /api/assessments to save/generate in MySQL
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          inputType,
          rawInputText: finalInputText,
          imageUrl: "", // Set imageUrl to empty string causes error
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
          <p className="font-bold text-lg">{loadingText}</p>
          <p className="text-sm text-muted-foreground">
            Sistem sedang bekerja memproses materi dan merumuskan soal kustom di
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
