"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Redirect to login if not authenticated
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">
            Memverifikasi Sesi Anda...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Dashboard Navbar */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">SoalGenerator</h1>
            <p className="text-[10px] text-muted-foreground">
              Pembuat Asesmen Pintar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">
              {user.displayName || "Guru"}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 flex flex-col container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
