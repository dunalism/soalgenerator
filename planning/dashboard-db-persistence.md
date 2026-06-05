# Planning - Implementasi Persistensi Database & Pembaruan Tombol Ekspor

## 1. Objective (Tujuan)

Mengimplementasikan penyimpanan dan pengambilan data asesmen dari database MySQL menggunakan Prisma ORM. Flow ini memindahkan state asesmen dari yang sebelumnya sementara di client-side ke database MySQL persisten (Solusi B). Selain itu, kami akan memperbarui tombol ekspor pada komponen `ReviewStep` untuk menghapus opsi cetak dan hanya menyisakan Unduh PDF, Unduh Word, dan Simpan ke Bank Soal.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/app/api/assessments/route.ts` (Refaktor instansiasi Prisma agar menggunakan Singleton instance dan optimalkan POST handler)
- [x] `src/app/api/assessments/[id]/route.ts` (Refaktor instansiasi Prisma ke Singleton instance, implementasikan GET dan PUT handler untuk persistence kustom)
- [x] `src/components/dashboard/ReviewStep.tsx` (Perbarui tombol aksi: Hapus opsi "Cetak Soal", gunakan hanya Unduh PDF, Unduh Word, dan Simpan ke Bank Soal)

_Catatan: File `src/app/dashboard/page.tsx` dan `src/app/dashboard/assessment/[id]/page.tsx` sudah terimplementasi dengan baik dan merujuk ke API dengan benar, namun akan divalidasi keaktifannya._

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Perbaikan Instansiasi Prisma pada API `src/app/api/assessments/route.ts`

- Hapus impor dinamis dan instansiasi langsung `new PrismaClient()` untuk mematuhi pedoman Prisma ORM (Golden Rule).
- Gantikan dengan: `import { prisma } from "@/lib/prisma";`

### Step 2: Perbaikan Instansiasi Prisma pada API `src/app/api/assessments/[id]/route.ts`

- Hapus instansiasi `new PrismaClient()` langsung dalam fungsi `GET` dan `PUT`.
- Gantikan dengan: `import { prisma } from "@/lib/prisma";`
- Pastikan transaksi Prisma `prisma.$transaction` berjalan dengan benar untuk membersihkan soal lama dan memasukkan versi terbaru saat aksi "Simpan ke Bank Soal" dipicu.

### Step 3: Pembaruan Komponen `ReviewStep.tsx`

- Pastikan tombol yang ditampilkan hanya:
  1. **Unduh PDF** (Icon `Download`, tombol utama filled)
  2. **Unduh Word (.docx)** (Icon `FileText`, tombol outline)
  3. **Simpan ke Bank Soal** (Icon `Save`, tombol outline/kustom)
- Pastikan tidak ada tombol "Cetak Soal" (`Printer` icon) yang tersisa.

---

## 4. Dependencies (Dependensi)

Tidak ada pustaka baru yang perlu dipasang. Penggunaan Prisma Client yang sudah ada melalui `@/lib/prisma` dan pustaka ikon `lucide-react` sudah mencukupi.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Koneksi Database Terputus:** Jika MySQL mati saat memproses asesmen baru atau memperbarui soal, API akan merespons dengan status 500 dan pesan error yang terstruktur sehingga frontend dapat menampilkan alert yang deskriptif tanpa mengalami crash.
- **Relasi Cascade:** Memastikan penghapusan soal lama (`tx.question.deleteMany`) secara otomatis menghapus pilihan jawaban (`Option`) terkait karena adanya konfigurasi `onDelete: Cascade` pada model `Option` di skema Prisma.
- **Pengecekan Otorisasi:** Endpoint akan memverifikasi keberadaan `userId` untuk memastikan data asesmen disimpan ke user yang valid.

---

## 6. Bahasa Indonesia Explanation (Penjelasan dalam Bahasa Indonesia)

Rencana ini bertujuan untuk memindahkan logika penyimpanan sementara (in-memory/state) ke dalam penyimpanan MySQL permanen. Dengan skema ini, guru tidak akan kehilangan data asesmen yang telah dihasilkan meskipun halaman web di-refresh (hard-reload) karena ID asesmen disimpan di URL rute `/dashboard/assessment/[id]`. Tombol ekspor juga dirapikan dengan membuang fitur cetak langsung demi kesederhanaan UX aplikasi.
