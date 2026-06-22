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
      return { label: "Ditutup", color: "bg-red-100 text-red-800" };
    }
    if (now < start) {
      return { label: "Akan Datang", color: "bg-blue-100 text-blue-800" };
    }
    if (now > end) {
      return { label: "Selesai", color: "bg-gray-100 text-gray-800" };
    }
    return {
      label: "Sedang Aktif",
      color: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    };
  };

  if (authLoading || examsLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">
          Memuat Sesi Ujian CBT...
        </p>
      </div>
    );
  }

  if (examsError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2 p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-semibold text-slate-800">
          Gagal Memuat Data
        </h3>
        <p className="text-sm text-slate-500 max-w-md">
          Terjadi kesalahan saat berkomunikasi dengan server. Silakan muat ulang
          halaman.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Sesi Ujian CBT
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola ujian mandiri tangguh dengan infrastruktur server hemat biaya
            (0 Rupiah).
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition"
        >
          + Buat Ujian CBT Baru
        </Button>
      </div>

      {/* DASHBOARD LIST */}
      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-slate-50 p-4 mb-4">
            <Clipboard className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Belum Ada Sesi Ujian
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md">
            Anda belum pernah membuat sesi ujian CBT. Klik tombol di atas untuk
            mengaktifkan sesi ujian baru dari paket soal yang sudah Anda miliki.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            return (
              <div
                key={exam.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300"
              >
                {/* Status Badge & Actions */}
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}
                  >
                    {status.label}
                  </span>
                  <div className="flex gap-2">
                    {/* Tutup / Buka Ujian Button */}
                    {exam.isActive && status.label === "Sedang Aktif" ? (
                      <button
                        onClick={() => handleToggleActive(exam.id, true)}
                        title="Tutup Ujian"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    ) : (
                      !exam.isActive && (
                        <button
                          onClick={() => handleToggleActive(exam.id, false)}
                          title="Aktifkan Kembali Ujian"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )
                    )}

                    {/* Hapus Button */}
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      title="Hapus Sesi Ujian"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition">
                    {exam.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Paket: {exam.assessment.title || "Tanpa Judul"} (
                    {exam.assessment.questionCount} Soal)
                  </p>
                </div>

                {/* TOKEN BOX */}
                <div className="mb-6 rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Token Akses Siswa
                    </p>
                    <p className="text-2xl font-black tracking-wider text-slate-800 font-mono">
                      {exam.token}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyToken(exam.token)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      copiedToken === exam.token
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
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
                  </button>
                </div>

                {/* METRICS & CONFIG */}
                <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Durasi: <strong>{exam.duration} Menit</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Mulai: {formatDateDisplay(exam.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Selesai: {formatDateDisplay(exam.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Siswa Submit:{" "}
                      <strong>{exam._count.attempts} Siswa</strong>
                    </span>
                  </div>

                  {/* Shuffling Indicators */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {exam.shuffleQuestions && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        <Shuffle className="h-2.5 w-2.5" /> Soal Diacak
                      </span>
                    )}
                    {exam.shuffleOptions && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        <Shuffle className="h-2.5 w-2.5" /> Opsi Diacak
                      </span>
                    )}
                    {exam.showLeaderboard && (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                        🏆 Leaderboard Publik
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTON */}
                <Button
                  onClick={() =>
                    router.push(`/dashboard/exams/${exam.id}/results`)
                  }
                  className="w-full bg-slate-800 hover:bg-indigo-600 text-white font-semibold transition"
                >
                  <Eye className="mr-2 h-4 w-4" /> Lihat Hasil & Rekap Nilai
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL (BUAT UJIAN BARU) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-800">
                  Buat Sesi Ujian CBT
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateExam} className="space-y-4">
              {/* Dropdown Pilih Paket Soal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pilih Paket Soal (Assessment){" "}
                  <span className="text-rose-500">*</span>
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="">-- Pilih Paket Soal --</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title || "Tanpa Judul"} ({a.questionCount} Soal -{" "}
                      {a.questionType})
                    </option>
                  ))}
                </select>
                {assessments.length === 0 && (
                  <p className="mt-1 text-xs text-rose-500">
                    Anda belum memiliki Paket Soal. Silakan buat paket soal
                    terlebih dahulu di menu Bank Soal.
                  </p>
                )}
              </div>

              {/* Judul Ujian */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Judul Sesi Ujian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ujian Harian Matematika Semester Ganjil"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Durasi */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Durasi Pengerjaan (Menit){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={examDuration}
                    onChange={(e) =>
                      setExamDuration(
                        Math.max(1, parseInt(e.target.value, 10) || 0),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                {/* Toggle Leaderboard */}
                <div className="flex flex-col justify-center rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">
                        Papan Peringkat
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tampilkan peringkat publik siswa
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLeaderboard}
                      onChange={(e) => setShowLeaderboard(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Batasan Waktu */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Waktu Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Waktu Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
              </div>

              {/* Fitur Keamanan Pengacakan */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  ⚙️ Fitur Pengacakan (Anti Contek)
                </span>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Acak Soal */}
                  <div className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-2.5">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">
                        Acak Urutan Soal
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Urutan butir soal diacak untuk tiap siswa
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500"
                    />
                  </div>

                  {/* Acak Opsi */}
                  <div className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-2.5">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">
                        Acak Pilihan Jawaban
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Pilihan ganda (A/B/C/D) diacak per siswa
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Informational Warning */}
              <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/50 p-4 text-xs text-indigo-700 flex gap-2.5">
                <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Arsitektur 0 Rupiah Siap Bekerja:</strong> Sistem
                  secara otomatis memproduksi file statis JSON aman tanpa kunci
                  jawaban di server. Siswa akan mengunduh soal secara statis
                  tanpa membuat database TiDB Anda kewalahan.
                </p>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="font-semibold text-slate-600"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition flex items-center gap-1.5"
                >
                  {submitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Aktifkan Sesi CBT
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
