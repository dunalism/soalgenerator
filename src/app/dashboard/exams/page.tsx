"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Loader2,
  Clipboard,
  Check,
  Trash2,
  X,
  Play,
  Square,
  Users,
  Calendar,
  Clock,
  Settings,
  AlertTriangle,
  Shuffle,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useDialog } from "@/components/ui/dialog-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
  const [submitting, setSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDuration, setExamDuration] = useState(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

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

  // Set default waktu saat membuka modal (waktu mulai = sekarang, selesai = besok)
  const openCreateModal = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Format to local ISO-like string required for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatDateTime = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    setStartTime(formatDateTime(now));
    setEndTime(formatDateTime(tomorrow));
    setSelectedAssessmentId("");
    setExamTitle("");
    setExamDuration(60);
    setShowLeaderboard(true);
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setIsModalOpen(true);
  };

  // Handler copy token ke clipboard
  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error("Gagal menyalin token:", err);
    }
  };

  // Handler pembuatan ujian baru
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssessmentId) {
      showAlert("Validasi", "Silakan pilih Paket Soal terlebih dahulu.");
      return;
    }
    if (!examTitle.trim()) {
      showAlert("Validasi", "Judul ujian wajib diisi.");
      return;
    }
    if (examDuration <= 0) {
      showAlert("Validasi", "Durasi pengerjaan harus lebih besar dari 0.");
      return;
    }

    const startVal = new Date(startTime);
    const endVal = new Date(endTime);

    if (startVal >= endVal) {
      showAlert(
        "Validasi",
        "Waktu selesai harus lebih lambat dari waktu mulai.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          assessmentId: selectedAssessmentId,
          title: examTitle,
          duration: examDuration,
          startTime: startVal.toISOString(),
          endTime: endVal.toISOString(),
          showLeaderboard,
          shuffleQuestions,
          shuffleOptions,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        showAlert(
          "Sukses",
          `Ujian CBT berhasil diaktifkan dengan Token: ${result.data.token}`,
        );
        mutateExams();
      } else {
        showAlert("Gagal", result.error || "Gagal membuat sesi ujian.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showAlert("Error", "Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

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

  // Membantu format tampilan tanggal
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

  // Cek apakah ujian saat ini masih berlaku secara waktu
  const getExamStatus = (exam: ExamItem) => {
    const now = new Date().getTime();
    const start = new Date(exam.startTime).getTime();
    const end = new Date(exam.endTime).getTime();

    if (!exam.isActive) {
      return { label: "Ditutup", variant: "destructive" as const };
    }
    if (now < start) {
      return { label: "Akan Datang", variant: "secondary" as const };
    }
    if (now > end) {
      return { label: "Selesai", variant: "outline" as const };
    }
    return { label: "Sedang Aktif", variant: "default" as const };
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
        <Button onClick={openCreateModal} variant="default" size="lg">
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
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            return (
              <Card
                key={exam.id}
                className="flex flex-col justify-between transition-all hover:ring-1 hover:ring-primary/50"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant={status.variant}
                      size="xs"
                      disabled
                      className="pointer-events-none"
                    >
                      {status.label}
                    </Button>
                    <div className="flex gap-2">
                      {/* Tutup / Buka Ujian Button */}
                      {exam.isActive && status.label === "Sedang Aktif" ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleActive(exam.id, true)}
                          title="Tutup Ujian"
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : (
                        !exam.isActive && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggleActive(exam.id, false)}
                            title="Aktifkan Kembali Ujian"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )
                      )}

                      {/* Hapus Button */}
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        title="Hapus Sesi Ujian"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="leading-snug">{exam.title}</CardTitle>
                  <CardDescription>
                    Paket: {exam.assessment.title || "Tanpa Judul"} (
                    {exam.assessment.questionCount} Soal)
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* TOKEN BOX */}
                  <div className="rounded-lg bg-muted p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Token Akses Siswa
                      </p>
                      <p className="text-2xl font-black tracking-wider font-mono text-primary">
                        {exam.token}
                      </p>
                    </div>
                    <Button
                      variant={
                        copiedToken === exam.token ? "secondary" : "outline"
                      }
                      size="sm"
                      onClick={() => handleCopyToken(exam.token)}
                    >
                      {copiedToken === exam.token ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-3.5 w-3.5" />
                          Salin
                        </>
                      )}
                    </Button>
                  </div>

                  {/* METRICS & CONFIG */}
                  <div className="space-y-2 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        Durasi: <strong>{exam.duration} Menit</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Mulai: {formatDateDisplay(exam.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Selesai: {formatDateDisplay(exam.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        Siswa Submit:{" "}
                        <strong>{exam._count.attempts} Siswa</strong>
                      </span>
                    </div>

                    {/* Shuffling Indicators */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {exam.shuffleQuestions && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                          <Shuffle className="h-2.5 w-2.5" /> Soal Diacak
                        </span>
                      )}
                      {exam.shuffleOptions && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                          <Shuffle className="h-2.5 w-2.5" /> Opsi Diacak
                        </span>
                      )}
                      {exam.showLeaderboard && (
                        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          🏆 Leaderboard Publik
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 bg-transparent">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      router.push(`/dashboard/exams/${exam.id}/results`)
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" /> Lihat Hasil & Rekap Nilai
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* FORM MODAL (BUAT UJIAN BARU) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in text-foreground">
          <Card className="relative w-full max-w-2xl bg-card border border-border max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold">
                  Buat Sesi Ujian CBT
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            {/* Modal Body / Form */}
            <CardContent className="pt-4">
              <form onSubmit={handleCreateExam} className="space-y-4">
                {/* Dropdown Pilih Paket Soal */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pilih Paket Soal (Assessment){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={selectedAssessmentId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedAssessmentId(id);
                      if (id) {
                        const selected = assessments.find((a) => a.id === id);
                        if (selected) {
                          const titleName = selected.title || "Ujian Baru";
                          setExamTitle(`Sesi CBT - ${titleName}`);
                        }
                      }
                    }}
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  >
                    <option value="" className="dark:bg-card">
                      -- Pilih Paket Soal --
                    </option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id} className="dark:bg-card">
                        {a.title || "Tanpa Judul"} ({a.questionCount} Soal -{" "}
                        {a.questionType})
                      </option>
                    ))}
                  </select>
                  {assessments.length === 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      Anda belum memiliki Paket Soal. Silakan buat paket soal
                      terlebih dahulu di menu Bank Soal.
                    </p>
                  )}
                </div>

                {/* Judul Ujian */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Judul Sesi Ujian <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Misal: Ujian Harian Matematika Semester Ganjil"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Durasi */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Durasi Pengerjaan (Menit){" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={examDuration}
                      onChange={(e) =>
                        setExamDuration(
                          Math.max(1, parseInt(e.target.value, 10) || 0),
                        )
                      }
                    />
                  </div>

                  {/* Toggle Leaderboard */}
                  <div className="flex flex-col justify-center rounded-lg bg-muted/50 border p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold block">
                          Papan Peringkat
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Tampilkan peringkat publik siswa
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showLeaderboard}
                        onChange={(e) => setShowLeaderboard(e.target.checked)}
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Batasan Waktu */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Waktu Mulai <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-foreground bg-transparent dark:bg-input/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Waktu Selesai <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-foreground bg-transparent dark:bg-input/30"
                    />
                  </div>
                </div>

                {/* Fitur Keamanan Pengacakan */}
                <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    ⚙️ Fitur Pengacakan (Anti Contek)
                  </span>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Acak Soal */}
                    <div className="flex items-center justify-between bg-card border rounded-lg p-2.5">
                      <div>
                        <span className="text-xs font-semibold block">
                          Acak Urutan Soal
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          Urutan butir soal diacak untuk tiap siswa
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                      />
                    </div>

                    {/* Acak Opsi */}
                    <div className="flex items-center justify-between bg-card border rounded-lg p-2.5">
                      <div>
                        <span className="text-xs font-semibold block">
                          Acak Pilihan Jawaban
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          Pilihan ganda (A/B/C/D) diacak per siswa
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={shuffleOptions}
                        onChange={(e) => setShuffleOptions(e.target.checked)}
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Informational Warning */}
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-xs text-primary flex gap-2.5">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <p className="leading-relaxed">
                    <strong>Arsitektur 0 Rupiah Siap Bekerja:</strong> Sistem
                    secara otomatis memproduksi file statis JSON aman tanpa
                    kunci jawaban di server. Siswa akan mengunduh soal secara
                    statis tanpa membuat database TiDB Anda kewalahan.
                  </p>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} variant="default">
                    {submitting && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Aktifkan Sesi CBT
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
