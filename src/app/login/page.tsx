"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<{
    name?: string | null;
    email: string;
  } | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessUser(null);

    try {
      // 1. Sign in with Google using Firebase Authentication Client SDK
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email || !user.uid) {
        throw new Error("Gagal memperoleh data email dari Google.");
      }

      // 2. Sync user profile with MySQL using Next.js backend API
      const syncResponse = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email.split("@")[0],
        }),
      });

      if (!syncResponse.ok) {
        const syncData = await syncResponse.json();
        throw new Error(
          syncData.error || "Gagal melakukan sinkronisasi data ke database.",
        );
      }

      setSuccessUser({
        name: user.displayName,
        email: user.email,
      });
    } catch (err: unknown) {
      console.error("Login Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(
        errorMessage || "Terjadi kesalahan saat masuk menggunakan Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Masuk ke Aplikasi
          </CardTitle>
          <CardDescription className="text-sm">
            Gunakan akun Google Anda untuk memulai pembuatan soal otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm p-3 rounded-md text-center">
              {error}
            </div>
          )}

          {successUser && (
            <div className="bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 text-sm p-4 rounded-md text-center space-y-1">
              <p className="font-semibold text-base">Berhasil Masuk!</p>
              <p className="text-xs opacity-90">
                Halo, {successUser.name || successUser.email}. Data Anda telah
                tersinkronisasi ke database MySQL.
              </p>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{loading ? "Menghubungkan..." : "Masuk dengan Google"}</span>
          </Button>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground justify-center text-center pb-6">
          Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi
          kami.
        </CardFooter>
      </Card>
    </div>
  );
}
