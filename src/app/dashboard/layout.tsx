"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartProvider } from "@/lib/cart-context";
import { FloatingCartBar } from "@/components/dashboard/FloatingCartBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Monitor scroll for hiding/showing navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowHeader(false); // Sembunyikan saat scroll ke bawah
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true); // Tampilkan saat scroll ke atas
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-card/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-bold tracking-tight">
                SoalGenerator
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Pembuat Asesmen Pintar
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 border-l pl-3 sm:pl-6 h-8">
            <Link
              href="/dashboard"
              className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                pathname === "/dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/dashboard/bank-soal"
              className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                pathname === "/dashboard/bank-soal"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Bank Soal
            </Link>
            <Link
              href="/dashboard/exams"
              className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                pathname === "/dashboard/exams"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Ujian
            </Link>
          </nav>
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
      <CartProvider>
        <main className="flex-1 flex flex-col container max-w-7xl mx-auto pt-24 pb-24 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <FloatingCartBar />
      </CartProvider>
    </div>
  );
}
