import {
  Sparkles,
  Clock,
  FileDown,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck,
  Brain,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Navigation Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <Brain className="h-5 w-5 animate-pulse" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SoalGenerator AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard/bank-soal"
              className="text-sm font-medium hover:text-primary transition-colors hidden sm:inline-block"
            >
              Bank Soal
            </a>
            <a
              href="/dashboard"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold h-10 px-5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <span>Mulai Buat Soal</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-spin-slow" />
          <span>Solusi Administrasi Guru Modern & Kreatif</span>
        </div>
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.15] bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            Bapak & Ibu Guru, Capek Bikin Soal Ulangan Sampai Larut Malam?
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Dapatkan kembali akhir pekan berharga Anda bersama keluarga
            tercinta. Susun asesmen Kurikulum Merdeka berkualitas tinggi yang
            siap cetak hanya dalam 5 menit.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <a
            href="/dashboard"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:translate-y-[-1px] transition-all active:translate-y-0"
          >
            <span>Coba Gratis Sekarang</span>
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </a>
          <a
            href="#perbandingan"
            className="border bg-background/50 hover:bg-muted/50 text-foreground h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <span>Pelajari Mengapa Ini Berbeda</span>
          </a>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-12 border-t">
          <div className="space-y-1">
            <p className="text-3xl font-black text-primary">5 Menit</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Lama Pembuatan
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-primary">100%</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Format Native Word
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-primary">5+ Tipe</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Pilihan Asesmen
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-primary">Instant</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Ekstraksi Gambar OCR
            </p>
          </div>
        </div>
      </section>

      {/* Perbandingan Section */}
      <section id="perbandingan" className="border-y bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight">
              Kenapa Tidak Memakai AI Biasa Saja?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Banyak guru mencoba melakukan prompting manual di ChatGPT/Gemini
              web biasa. Namun, hasil yang didapat justru menambah pekerjaan
              baru. Berikut adalah perbandingannya:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* AI Biasa Card */}
            <div className="border bg-background rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-6 w-6" />
                  <span className="font-bold text-lg">
                    Prompting Manual di Web AI Biasa
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Guru harus memikirkan cara menyusun kalimat perintah (prompt)
                  yang panjang agar output sesuai, dan sering kali hasilnya
                  mengecewakan.
                </p>
                <div className="border-t pt-4 space-y-4 text-xs text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>Format Berantakan:</strong> Teks hasil salinan
                      dari web sering pecah, bergeser, dan berantakan saat
                      dipindahkan ke Microsoft Word.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>Penomoran Kacau:</strong> Nomor soal dan pilihan
                      jawaban (A, B, C, D, E) menempel rapat dengan teks
                      sehingga membingungkan siswa.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>Kunci Jawaban Tercampur:</strong> Kunci jawaban
                      muncul di bawah masing-masing soal, memaksa Anda memotong
                      dan memindahkannya manual satu-persatu ke lembar baru.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <strong>Keterbatasan Gambar:</strong> Tidak bisa
                      mengunggah tangkapan layar buku paket pelajaran secara
                      langsung untuk diekstrak teks materinya.
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-destructive/5 text-destructive rounded-lg p-3 text-[11px] font-semibold text-center border border-destructive/10 mt-4">
                Hasil: Menghabiskan waktu 1-2 jam ekstra hanya untuk merapikan
                dokumen Word.
              </div>
            </div>

            {/* SoalGenerator AI Card */}
            <div className="border-2 border-primary bg-primary/[0.01] rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-6 w-6 text-primary fill-primary/10" />
                  <span className="font-extrabold text-lg">
                    Menggunakan SoalGenerator AI
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Aplikasi dirancang secara khusus untuk kebutuhan pengajaran
                  nyata di Indonesia, mengotomatiskan seluruh alur kerja
                  administratif pembuat soal.
                </p>
                <div className="border-t pt-4 space-y-4 text-xs text-foreground/90">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Format DOCX Siap Pakai:</strong> Ekspor dalam
                      format `.docx` native asli (bukan HTML palsu) dengan font
                      **Times New Roman 12pt** standar kedinasan.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Hanging Indent Presisi:</strong> Penomoran soal
                      asli Word dengan indentasi gantung yang sempurna sehingga
                      nomor dan huruf tidak bertumpuk/bergeser.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Pilihan Ganda 2-Kolom Sejajar:</strong> Pilihan
                      jawaban (a, b, c, d, e) dibagi rata ke kiri dan kanan
                      menggunakan objek tabel borderless Word secara otomatis.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Page Break Kunci Jawaban:</strong> Memisahkan
                      Lembar Ujian dan Lembar Kunci Jawaban menggunakan objek
                      `PageBreak` resmi Word sehingga rapi di halaman baru.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Fitur Keranjang & Remix:</strong> Pilih
                      butir-butir soal terbaik secara individual dari paket yang
                      berbeda dan buat ujian remix baru tanpa menulis ulang.
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-primary/10 text-primary rounded-lg p-3 text-[11px] font-bold text-center border border-primary/20 mt-4">
                Hasil: Selesai dalam 5 menit, rapi, profesional, dan siap
                langsung dicetak!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Fitur Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-black tracking-tight">
            Fitur Cerdas yang Memudahkan Hidup Anda
          </h2>
          <p className="text-muted-foreground text-sm">
            Setiap fitur dirancang berdasarkan pemahaman mendalam atas lelahnya
            proses administrasi guru sehari-hari.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="border bg-background p-6 rounded-2xl space-y-4 hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-lg">
              Bagi Rata (Mixed Distribution)
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Membuat paket soal campuran kini tidak lagi memusingkan. Guru
              dapat membagi jumlah butir soal per-tipe secara presisi. Sistem
              akan memvalidasi agar jumlah pas sebelum proses dimulai.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="border bg-background p-6 rounded-2xl space-y-4 hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-lg">Remix Keranjang Soal</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Menyusun Penilaian Tengah Semester (PTS) atau Akhir Semester (PAS)
              kini sangat mudah. Ambil beberapa butir soal terpilih dari Bab 1,
              Bab 2, dan Bab 3, kumpulkan di keranjang, lalu satukan menjadi
              satu paket baru.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="border bg-background p-6 rounded-2xl space-y-4 hover:shadow-md transition-shadow">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary">
              <FileDown className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-lg">Ekspor Native .docx Asli</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Lupakan konverter online yang merusak dokumen Anda. Aplikasi kami
              menghasilkan file biner Word asli (.docx) yang di-layout secara
              profesional mengikuti standar resmi kedinasan sekolah.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Akhir Section */}
      <section className="border-t bg-gradient-to-r from-primary/10 via-primary/[0.02] to-background py-20 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Waktu Anda Terlalu Berharga untuk Dihabiskan di Depan Layar Laptop
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Siswa Anda berhak mendapatkan asesmen berkualitas, dan keluarga
              Anda berhak mendapatkan kehadiran penuh Anda di rumah. Mulai
              permudah administrasi ujian Anda hari ini.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="/dashboard"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/15"
            >
              <span>Mulai Buat Soal Sekarang</span>
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </a>
            <a
              href="/dashboard/bank-soal"
              className="border bg-background/50 hover:bg-muted/50 text-foreground h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <span>Buka Bank Soal Anda</span>
            </a>
          </div>
          <div className="flex justify-center items-center gap-6 pt-6 text-xs text-muted-foreground font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Sesi Aman & Terenkripsi
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-primary" />
              Mudah Digunakan Tanpa Ribet
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            © 2026 SoalGenerator AI. Dibuat dengan dedikasi penuh untuk kemajuan
            Guru & Pendidikan Indonesia.
          </p>
          <div className="flex gap-4">
            <a href="/dashboard" className="hover:text-primary">
              Dashboard
            </a>
            <a href="/dashboard/bank-soal" className="hover:text-primary">
              Bank Soal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
