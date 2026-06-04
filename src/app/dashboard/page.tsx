"use client";

import { useState } from "react";
import { InputStep } from "@/components/dashboard/InputStep";
import { ConfigStep } from "@/components/dashboard/ConfigStep";
import { ReviewStep } from "@/components/dashboard/ReviewStep";
import { Question } from "@/components/dashboard/QuestionCard";
import { ProgressBar } from "@/components/dashboard/ProgressBar";

export default function DashboardPage() {
  const [step, setStep] = useState<"INPUT" | "CONFIG" | "REVIEW">("INPUT");

  // State Step 1: Input Materi
  const [inputType, setInputType] = useState<"TEXT" | "IMAGE">("TEXT");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // State Step 2: Konfigurasi
  const [questionType, setQuestionType] = useState<string>("MULTIPLE_CHOICE");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("MEDIUM");

  // State Step 3: Hasil Soal
  const [questions, setQuestions] = useState<Question[]>([]);

  // Function to compile realistic dummy data based on user configuration
  const handleGenerateQuestions = () => {
    // Generate mock questions list depending on questionType selected
    const dummyQuestions: Question[] = [];

    if (questionType === "MULTIPLE_CHOICE" || questionType === "MIXED") {
      dummyQuestions.push(
        {
          id: "q1",
          questionText:
            "Planet manakah di tata surya kita yang dijuluki sebagai 'Planet Merah'?",
          type: "MULTIPLE_CHOICE",
          options: [
            { id: "q1-o1", optionText: "Venus", isCorrect: false },
            { id: "q1-o2", optionText: "Mars", isCorrect: true },
            { id: "q1-o3", optionText: "Merkurius", isCorrect: false },
            { id: "q1-o4", optionText: "Jupiter", isCorrect: false },
          ],
          answerKey: "Mars",
        },
        {
          id: "q2",
          questionText:
            "Lapisan atmosfer bumi manakah yang berfungsi melindungi bumi dari radiasi ultraviolet berbahaya?",
          type: "MULTIPLE_CHOICE",
          options: [
            { id: "q2-o1", optionText: "Mesosfer", isCorrect: false },
            {
              id: "q2-o2",
              optionText: "Stratosfer (Lapisan Ozon)",
              isCorrect: true,
            },
            { id: "q2-o3", optionText: "Troposfer", isCorrect: false },
            { id: "q2-o4", optionText: "Termosfer", isCorrect: false },
          ],
          answerKey: "Stratosfer (Lapisan Ozon)",
        },
      );
    }

    if (questionType === "TRUE_FALSE" || questionType === "MIXED") {
      dummyQuestions.push(
        {
          id: "q3",
          questionText:
            "Matahari merupakan sebuah bintang raksasa yang menghasilkan energinya melalui reaksi fusi nuklir.",
          type: "TRUE_FALSE",
          options: [],
          answerKey: "Benar",
        },
        {
          id: "q4",
          questionText:
            "Planet Jupiter memiliki permukaan padat yang mirip dengan permukaan Bumi.",
          type: "TRUE_FALSE",
          options: [],
          answerKey: "Salah",
        },
      );
    }

    if (questionType === "SHORT_ANSWER" || questionType === "MIXED") {
      dummyQuestions.push(
        {
          id: "q5",
          questionText:
            "Sebutkan satelit alami terbesar yang mengitari planet Bumi kita!",
          type: "SHORT_ANSWER",
          options: [],
          answerKey: "Bulan",
        },
        {
          id: "q6",
          questionText:
            "Apa nama galaksi spiral raksasa yang menjadi rumah bagi tata surya kita?",
          type: "SHORT_ANSWER",
          options: [],
          answerKey: "Bima Sakti (Milky Way)",
        },
      );
    }

    // Adjust questionCount dynamically
    const slicedQuestions = dummyQuestions.slice(0, questionCount);
    setQuestions(slicedQuestions);
    setStep("REVIEW");
  };

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

      {step === "REVIEW" && (
        <ReviewStep
          questions={questions}
          setQuestions={setQuestions}
          inputType={inputType}
          questionType={questionType}
          difficulty={difficulty}
          onBack={() => setStep("CONFIG")}
        />
      )}
    </div>
  );
}
