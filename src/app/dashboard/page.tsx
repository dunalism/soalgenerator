"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Loader2,
  Brain,
  Sparkles,
  Layers,
  HelpCircle,
  TrendingUp,
  Plus,
} from "lucide-react";
import { useDialog } from "@/components/ui/dialog-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessmentCard } from "@/components/dashboard/AssessmentCard";
import { Assessment, StatsData } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);

  const fetchDashboardData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/stats?userId=${uid}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setStats(data.stats);
        setRecentAssessments(data.recentAssessments);
      } else {
        console.error("Gagal mengambil data statistik dashboard:", data.error);
      }
    } catch (error) {
      console.error("Fetch dashboard stats error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Monitor auth status and fetch stats
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        setUserName(currentUser.displayName || currentUser.email);
        fetchDashboardData(currentUser.uid);
      } else {
        router.push("/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [fetchDashboardData, router]);

  // Handle deletion of an assessment from the recent list
  const handleDeleteAssessment = async (id: string) => {
    showConfirm(
      "Hapus Paket Soal",
      "Apakah Anda yakin ingin menghapus seluruh paket soal ini? Semua butir soal di dalamnya akan dihapus permanen.",
      async () => {
        try {
          const response = await fetch(`/api/assessments/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            setRecentAssessments((prev) =>
              prev.filter((item) => item.id !== id),
            );
            // Re-fetch aggregate stats to keep metrics accurate after deletion
            if (userId) fetchDashboardData(userId);
            showAlert("Sukses", "Paket soal berhasil dihapus!");
          } else {
            const data = await response.json();
            showAlert("Gagal", data.error || "Gagal menghapus paket soal.");
          }
        } catch (error) {
          console.error("Delete error:", error);
          showAlert(
            "Error Koneksi",
            "Terjadi kesalahan koneksi saat menghapus paket soal.",
          );
        }
      },
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Memuat Dashboard Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      {/* Welcome & Greeting Section */}
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold tracking-tight">
          Halo, {userName || "Guru Pintar"}! 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Selamat datang kembali di Control Center asisten pembuatan soal AI
          Anda.
        </p>
      </div>

      {/* Hero CTA Block */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm rounded-2xl">
        <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Teknologi Generatif Pintar</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight leading-none">
              Buat Asesmen Kustom Baru dengan AI
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ubah teks ringkasan materi pelajaran, kurikulum, atau gambar buku
              paket dengan OCR pintar menjadi soal pilihan ganda, essay, atau
              Uraian/Esai instan.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/generate")}
            size="lg"
            className="flex items-center gap-2 font-bold px-6 h-12 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Mulai Buat Soal</span>
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Aggregate Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paket Soal
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAssessments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paket asesmen tersimpan di database
            </p>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Butir Soal
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <HelpCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalQuestions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Butir soal ujian siap cetak
            </p>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pola Kesulitan Soal
            </CardTitle>
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">Mudah:</span>
              <span className="font-semibold">
                {stats?.difficultyDistribution.EASY || 0} Paket
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sedang:</span>
              <span className="font-semibold">
                {stats?.difficultyDistribution.MEDIUM || 0} Paket
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">HOTS / Sulit:</span>
              <span className="font-semibold">
                {stats?.difficultyDistribution.HARD || 0} Paket
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent History Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Riwayat Pembuatan Terakhir
          </h3>
          {recentAssessments.length > 0 && (
            <Button
              onClick={() => router.push("/dashboard/bank-soal")}
              variant="link"
              className="text-primary p-0 h-auto font-semibold"
            >
              Lihat Semua Bank Soal ➔
            </Button>
          )}
        </div>

        {recentAssessments.length === 0 ? (
          <div className="border border-dashed rounded-xl py-12 px-4 text-center space-y-4 bg-muted/10">
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Anda belum pernah membuat paket soal menggunakan asisten AI.
            </p>
            <Button
              onClick={() => router.push("/dashboard/generate")}
              variant="outline"
              size="sm"
            >
              Buat Paket Soal Pertama Anda
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                debouncedSearch="" // No active keyword search on home dashboard
                onDelete={handleDeleteAssessment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
