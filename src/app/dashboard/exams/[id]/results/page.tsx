"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Award,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDialog } from "@/components/ui/dialog-provider";

interface ExamDetails {
  id: string;
  title: string;
  token: string;
  duration: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  assessmentTitle: string;
  questionsCount: number;
}

interface StatsSummary {
  averageScore: number;
  maxScore: number;
  minScore: number;
  totalAttempts: number;
}

interface StudentAnswerItem {
  id: string;
  questionId: string;
  chosenOptionId: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  questionText: string;
  questionType: string;
  answerKey: string;
}

interface ExamAttemptItem {
  id: string;
  studentName: string;
  studentId: string | null;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  isGraded: boolean;
  answers: StudentAnswerItem[];
}

interface ItemAnalysisItem {
  questionId: string;
  questionText: string;
  type: string;
  order: number;
  wrongCount: number;
  totalCount: number;
  errorPercentage: number;
}

interface ExamResultsResponse {
  success: boolean;
  exam: ExamDetails;
  stats: StatsSummary;
  attempts: ExamAttemptItem[];
  itemAnalysis: ItemAnalysisItem[];
}

export default function ExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { showAlert } = useDialog();

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Modal State untuk Koreksi Esai
  const [selectedAttempt, setSelectedAttempt] =
    useState<ExamAttemptItem | null>(null);
  const [gradingQuestion, setGradingQuestion] =
    useState<StudentAnswerItem | null>(null);
  const [essayScore, setEssayScore] = useState<number>(100);
  const [isGradingLoading, setIsGradingLoading] = useState(false);

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

  // Fetch data hasil ujian dengan SWR
  const { data, error, isLoading, mutate } = useSWR<ExamResultsResponse>(
    userId ? `/api/exams/${id}/results` : null,
    fetcher,
  );

  const exam = data?.exam;
  const stats = data?.stats;
  const attempts = data?.attempts || [];
  const itemAnalysis = data?.itemAnalysis || [];

  // Helper menghilangkan HTML Tag untuk analisis butir soal
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  };

  // Format durasi pengerjaan siswa
  const formatDuration = (startedAt: string, submittedAt: string | null) => {
    if (!submittedAt) return "-";
    const diff =
      new Date(submittedAt).getTime() - new Date(startedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}d`;
  };

  // Format tanggal display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Ekspor CSV murni client-side
  const handleExportCSV = () => {
    if (!attempts.length || !exam) return;

    const headers = [
      "No. Absen/NISN",
      "Nama Siswa",
      "Waktu Mulai",
      "Waktu Selesai",
      "Durasi",
      "Skor Akhir",
      "Status Penilaian",
    ];

    const rows = attempts.map((att) => [
      att.studentId || "-",
      att.studentName,
      att.startedAt ? formatDateDisplay(att.startedAt) : "-",
      att.submittedAt ? formatDateDisplay(att.submittedAt) : "-",
      formatDuration(att.startedAt, att.submittedAt),
      att.score !== null ? att.score : "Belum Dinilai",
      att.isGraded ? "Sudah Dinilai" : "Belum Dinilai",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Hasil_Ujian_${exam.token}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Penilaian Esai ke API
  const handleSaveEssayGrade = async () => {
    if (!selectedAttempt || !gradingQuestion) return;

    setIsGradingLoading(true);
    try {
      const response = await fetch(`/api/exams/${id}/score-essay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: selectedAttempt.id,
          questionId: gradingQuestion.questionId,
          scoreEssay: essayScore,
        }),
      });

      if (response.ok) {
        showAlert("Sukses", "Nilai esai berhasil disimpan!");

        // Mutate SWR cache
        await mutate();

        // Update selectedAttempt state agar dialog ter-refresh dengan data terbaru
        const updatedResponse = await fetch(`/api/exams/${id}/results`);
        if (updatedResponse.ok) {
          const updatedData: ExamResultsResponse = await updatedResponse.json();
          const nextAttempt = updatedData.attempts.find(
            (a) => a.id === selectedAttempt.id,
          );
          if (nextAttempt) {
            setSelectedAttempt(nextAttempt);
          }
        }

        setGradingQuestion(null);
      } else {
        const result = await response.json();
        showAlert("Gagal", result.error || "Gagal menyimpan penilaian esai.");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Terjadi kesalahan jaringan.");
    } finally {
      setIsGradingLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Memuat Hasil Analisis Ujian...
        </p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2 p-4 text-center bg-background text-foreground">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">Gagal Memuat Hasil</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Terjadi kesalahan saat memuat analisis ujian ini. Silakan coba
          beberapa saat lagi.
        </p>
        <Button
          onClick={() => router.push("/dashboard/exams")}
          className="mt-4"
        >
          Kembali ke Daftar Sesi
        </Button>
      </div>
    );
  }

  // Cek apakah ujian ini memiliki soal SHORT_ANSWER / Uraian
  const hasEssayQuestions = attempts.some((att) =>
    att.answers.some((ans) => ans.questionType === "SHORT_ANSWER"),
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 bg-background text-foreground space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="-ml-3 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/dashboard/exams")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Sesi Ujian
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {exam?.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Paket Soal: <strong>{exam?.assessmentTitle}</strong> | Kode Token:{" "}
            <span className="font-mono font-bold text-primary">
              {exam?.token}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="lg"
            disabled={attempts.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Ekspor CSV
          </Button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Rata-Rata Nilai
            </p>
            <p className="text-2xl font-black">{stats?.averageScore ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Nilai Tertinggi
            </p>
            <p className="text-2xl font-black">{stats?.maxScore ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Nilai Terendah
            </p>
            <p className="text-2xl font-black">{stats?.minScore ?? 0}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Siswa Mengerjakan
            </p>
            <p className="text-2xl font-black">
              {stats?.totalAttempts ?? 0}{" "}
              <span className="text-xs text-muted-foreground">Siswa</span>
            </p>
          </div>
        </Card>
      </div>

      {/* TABLE SECTION */}
      <Card>
        <CardHeader>
          <CardTitle>Lembar Jawaban & Hasil Siswa</CardTitle>
          <CardDescription>
            Rincian nilai siswa yang telah mensubmit lembar pengerjaan CBT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada siswa yang mengirimkan lembar jawaban.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Absen / ID</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead className="text-right">Skor</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-mono text-xs">
                      {attempt.studentId || "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {attempt.studentName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {attempt.startedAt
                        ? formatDateDisplay(attempt.startedAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {attempt.submittedAt
                        ? formatDateDisplay(attempt.submittedAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDuration(attempt.startedAt, attempt.submittedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          attempt.score !== null && attempt.score >= 75
                            ? "bg-emerald-500/10 text-emerald-500"
                            : attempt.score !== null && attempt.score >= 50
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-500"
                        }`}
                      >
                        {attempt.score !== null
                          ? attempt.score
                          : "Belum Dinilai"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasEssayQuestions && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedAttempt(attempt)}
                        >
                          Periksa Esai
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ITEM ANALYSIS SECTION */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">
            Analisis Butir Soal (Item Analysis)
          </h2>
          <p className="text-xs text-muted-foreground">
            Mendeteksi tingkat kesulitan soal secara riil berdasarkan persentase
            kesalahan siswa.
          </p>
        </div>

        {itemAnalysis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada data analisis butir soal.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {itemAnalysis.map((item) => {
              const isHighError = item.errorPercentage >= 70;
              return (
                <Card
                  key={item.questionId}
                  className={`p-4 flex flex-col justify-between border transition-all ${
                    isHighError
                      ? "border-destructive/50 bg-destructive/5 hover:border-destructive"
                      : "hover:border-primary/30"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        Soal #{item.order}
                      </span>
                      {isHighError && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />{" "}
                          SULIT
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-3">
                      {stripHtml(item.questionText) || "Soal tanpa teks"}
                    </p>
                  </div>
                  <div className="pt-4 border-t mt-3 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Tingkat Kesalahan Siswa:
                    </p>
                    <p
                      className={`text-sm font-black ${
                        isHighError
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.errorPercentage}%
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOG PERIKSA ESAI */}
      <Dialog
        open={selectedAttempt !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAttempt(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Koreksi Jawaban Esai Siswa</DialogTitle>
            <DialogDescription>
              Menilai jawaban soal bertipe SHORT_ANSWER (Uraian) untuk siswa{" "}
              <strong>{selectedAttempt?.studentName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 my-4">
            {selectedAttempt?.answers
              .filter((ans) => ans.questionType === "SHORT_ANSWER")
              .map((ans, idx) => (
                <Card key={ans.id} className="p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground">
                      Pertanyaan #{idx + 1}
                    </p>
                    <p className="text-sm font-semibold">
                      {stripHtml(ans.questionText)}
                    </p>
                  </div>

                  <div className="bg-muted p-3 rounded-lg space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Jawaban Siswa:
                    </p>
                    <p className="text-sm italic font-medium">
                      {ans.textAnswer
                        ? `"${ans.textAnswer}"`
                        : "(Tidak Menjawab)"}
                    </p>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg space-y-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-500">
                      Kunci Jawaban Guru:
                    </p>
                    <p className="text-sm font-semibold text-emerald-600">
                      {ans.answerKey}
                    </p>
                  </div>

                  {gradingQuestion?.id === ans.id ? (
                    <div className="bg-muted/40 p-4 rounded-lg space-y-3">
                      <p className="text-xs font-semibold">
                        Tentukan Kebenaran Jawaban:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className={`flex-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10
                            ${essayScore == 100 && "bg-emerald-500/10!"}
                            `}
                          onClick={() => {
                            setEssayScore(100);
                          }}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" /> Benar
                        </Button>
                        <Button
                          variant="secondary"
                          className={`flex-1 text-destructive hover:text-destructive/90 hover:bg-destructive/10
                            ${essayScore == 0 && "bg-destructive/10!"}`}
                          onClick={() => {
                            setEssayScore(0);
                          }}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" /> Salah
                        </Button>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGradingQuestion(null)}
                        >
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEssayGrade}
                          disabled={isGradingLoading}
                        >
                          {isGradingLoading ? "Menyimpan..." : "Simpan Nilai"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <p className="text-xs">
                        Status Saat Ini:{" "}
                        {ans.isCorrect === true ? (
                          <span className="text-emerald-500 font-bold">
                            BENAR
                          </span>
                        ) : ans.isCorrect === false ? (
                          <span className="text-destructive font-bold">
                            SALAH
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-semibold">
                            BELUM DIPERIKSA
                          </span>
                        )}
                      </p>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setGradingQuestion(ans);
                          setEssayScore(ans.isCorrect === true ? 100 : 0);
                        }}
                      >
                        Koreksi
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
          </div>

          <DialogFooter showCloseButton={true}>
            <Button onClick={() => setSelectedAttempt(null)} variant="outline">
              Selesai Memeriksa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
