# Rencana Implementasi Persistensi Database (Solusi B) & Pembaruan Tombol Ekspor

## 1. Arsitektur Relasional Database (Prisma MySQL)

Kita akan memanfaatkan tabel yang sudah didefinisikan sebelumnya di `prisma/schema.prisma`:

- **`Assessment`**: Menyimpan materi input, tipe input, tipe soal, jumlah soal, dan tingkat kesulitan.
- **`Question`**: Menyimpan detail soal (teks soal, tipe, order, kunci jawaban).
- **`Option`**: Menyimpan pilihan jawaban jika bertipe pilihan ganda.

---

## 2. Rencana Pembuatan API Endpoints

### A. API Simpan / Generate Asesmen (`/api/assessments/route.ts`)

- Menerima input dari Tahap 2 (materi input, konfigurasi, dll).
- Membuat record `Assessment` baru di MySQL.
- Menghasilkan soal dummy (atau nantinya hasil dari AI) dan menyimpannya langsung ke tabel `Question` dan `Option` di database.
- Mengembalikan `id` dari Asesmen yang sukses dibuat.

### B. API Ambil & Simpan Perubahan Asesmen (`/api/assessments/[id]/route.ts`)

- **GET**: Membaca data `Assessment` beserta relasi `questions` dan `options` dari MySQL berdasarkan ID asesmen untuk dirender di halaman Review.
- **PUT**: Menyimpan pengeditan soal kustom (update/delete/add) dari halaman Review ke database MySQL (Aksi "Simpan ke Bank Soal").

---

## 3. Struktur Routing Baru di Next.js App Router

1. **Dashboard Utama (`/dashboard/page.tsx`)**:
   - Hanya mengurusi **Tahap 1 (Input Materi)** dan **Tahap 2 (Konfigurasi)**.
   - Saat tombol "Buat Soal Sekarang" diklik, dashboard memanggil API POST `/api/assessments` dan mengarahkan pengguna ke `/dashboard/assessment/[id]`.

2. **Halaman Review Dinamis (`/dashboard/assessment/[id]/page.tsx`)**:
   - Rute dinamis yang dilingkari oleh layout dashboard terproteksi.
   - Mengambil data asesmen lengkap dari API GET `/api/assessments/[id]` saat memuat halaman (_on mount_).
   - Merender komponen **`ReviewStep`** secara langsung. Jika halaman di-hardrefresh, data pengerjaan tidak akan hilang karena ID asesmen tercantum di URL!

---

## 4. Pembaruan Komponen ReviewStep & Penghapusan Tombol Cetak

Sesuai instruksi:

- Menghapus tombol "Cetak Soal" (`Printer` icon).
- Tombol yang tersedia hanya:
  1. **Unduh PDF** (`Download` icon, jenis tombol utama).
  2. **Unduh Word (.docx)** (`FileText` icon, jenis tombol outline).
  3. **Simpan ke Bank Soal** (`Save` icon, jenis tombol outline / kustom untuk men-trigger penyimpanan perubahan ke database MySQL).
