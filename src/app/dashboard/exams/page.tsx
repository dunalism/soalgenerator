"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, Clipboard, AlertTriangle } from "lucide-react";
import { useDialog } from "@/components/ui/dialog-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { ExamCard } from "@/components/dashboard/ExamCard";
import { CreateExamDialog } from "@/components/dashboard/CreateExamDialog";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface AssessmentOption {
  id: string;
  title: string | null;
  questionCount: number;
  questionType: string;
}

interface ExamItem {
  id: string;
  title: string;
  token: string;
  duration: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  showLeaderboard: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  assessment: {
    title: string | null;
    questionCount: number;
    questionType: string;
  };
  _count: {
    attempts: number;
  };
}

interface ExamsResponse {
  success: boolean;
  exams: ExamItem[];
}

interface AssessmentsListResponse {
  success: boolean;
  assessments: AssessmentOption[];
}

export default function ExamsDashboardPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Exams milik user
  const {
    data: examsData,
    error: examsError,
    isLoading: examsLoading,
    mutate: mutateExams,
  } = useSWR<ExamsResponse>(
    userId ? `/api/exams?userId=${userId}` : null,
    fetcher,
  );

  // Fetch Paket Soal (Assessments) untuk dropdown modal
  const { data: assessmentsData } = useSWR<AssessmentsListResponse>(
    userId ? `/api/assessments?userId=${userId}&limit=100` : null,
    fetcher,
  );

  const exams = examsData?.exams || [];
  const assessments = assessmentsData?.assessments || [];

  // Monitor status autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
      } else {
        router.push("/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Handler menonaktifkan status ujian (Tutup Ujian)
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "menutup" : "mengaktifkan kembali";
    showConfirm(
      "Ubah Status Sesi Ujian",
      `Apakah Anda yakin ingin ${actionText} sesi ujian ini? Siswa tidak akan bisa masuk ujian jika dinonaktifkan.`,
      async () => {
        try {
          const response = await fetch(`/api/exams/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !currentStatus }),
          });

          if (response.ok) {
            showAlert(
              "Sukses",
              `Sesi ujian berhasil ${currentStatus ? "ditutup" : "diaktifkan kembali"}!`,
            );
            mutateExams();
          } else {
            const result = await response.json();
            showAlert("Gagal", result.error || "Gagal mengubah status ujian.");
          }
        } catch (error) {
          console.error("Status toggle error:", error);
          showAlert("Error", "Terjadi kesalahan jaringan.");
        }
      },
    );
  };

  // Handler menghapus ujian CBT
  const handleDeleteExam = async (id: string, title: string) => {
    showConfirm(
      "Hapus Sesi Ujian",
      `Apakah Anda yakin ingin menghapus ujian "${title}"? Tindakan ini permanen. Seluruh lembar jawaban siswa dan file JSON statis di server akan dihapus!`,
      async () => {
        try {
          const response = await fetch(`/api/exams/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            showAlert("Sukses", "Sesi ujian berhasil dihapus!");
            mutateExams();
          } else {
            const result = await response.json();
            showAlert("Gagal", result.error || "Gagal menghapus sesi ujian.");
          }
        } catch (error) {
          console.error("Delete exam error:", error);
          showAlert("Error", "Terjadi kesalahan jaringan.");
        }
      },
    );
  };

  if (authLoading || examsLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Memuat Sesi Ujian CBT...
        </p>
      </div>
    );
  }

  if (examsError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2 p-4 text-center bg-background text-foreground">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Gagal Memuat Data</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Terjadi kesalahan saat berkomunikasi dengan server. Silakan muat ulang
          halaman.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 bg-background text-foreground">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Sesi Ujian CBT
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola ujian mandiri tangguh dengan infrastruktur server hemat biaya
            (0 Rupiah).
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="default"
          size="lg"
        >
          + Buat Ujian CBT Baru
        </Button>
      </div>

      {/* DASHBOARD LIST */}
      {exams.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Clipboard className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg font-semibold">
            Belum Ada Sesi Ujian
          </CardTitle>
          <CardDescription className="mt-1 max-w-md">
            Anda belum pernah membuat sesi ujian CBT. Klik tombol di atas untuk
            mengaktifkan sesi ujian baru dari paket soal yang sudah Anda miliki.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteExam}
            />
          ))}
        </div>
      )}

      {/* FORM MODAL (BUAT UJIAN BARU) */}
      <CreateExamDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId || ""}
        assessments={assessments}
        onSuccess={(token) => {
          setIsModalOpen(false);
          showAlert(
            "Sukses",
            `Ujian CBT berhasil diaktifkan dengan Token: ${token}`,
          );
          mutateExams();
        }}
      />
    </div>
  );
}
