# Rencana Perbaikan: Refactoring Bank Soal Berbasis Paket Soal (Assessments)

## 1. Objective (Tujuan)

Mengubah alur halaman `/dashboard/bank-soal` dari yang sebelumnya menampilkan daftar butir soal individual secara flat (tanpa konteks) menjadi berbasis **Paket Soal (Assessments)**. Hal ini akan meningkatkan fungsionalitas dan nilai guna rute Bank Soal agar bertindak sebagai arsip terstruktur dari hasil pembuatan soal di `/dashboard`. Selain itu, ini juga mempersiapkan landasan data analitik untuk dashboard di tahap selanjutnya (sesuai prinsip SOLID/SRP).

## 2. Affected Files (File yang Terpengaruh)

- `src/app/api/assessments/route.ts` (Ditambahkan metode `GET` untuk mengambil daftar Paket Soal/Assessments ter-paginasi milik user tertentu)
- `src/app/dashboard/bank-soal/page.tsx` (Refactor UI utama untuk menampilkan daftar Paket Soal, filter pencarian, panel detail paket, dan manajemen butir soal di dalamnya)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Tahap 1: Backend API Enhancement

1. **Modifikasi `src/app/api/assessments/route.ts`**:
   - Tambahkan fungsi handler `export async function GET(request: Request)`.
   - Ambil `userId` dari search query params.
   - Ambil query parameter tambahan seperti `page` (default `1`), `limit` (default `6`), dan `search` (kata kunci filter jika ada).
   - Gunakan Prisma untuk menanyakan tabel `Assessment` milik user tersebut, termasuk:
     - Count total paket untuk paginasi.
     - Include relasi `questions` dan count butir soal di dalamnya.
     - Urutkan berdasarkan `createdAt` DESC (paket terbaru di atas).
   - Kembalikan respon JSON berisi daftar `assessments`, `totalCount`, dan status `hasMore`.

### Tahap 2: UI/UX Refactoring di `/dashboard/bank-soal`

2. **Modifikasi `src/app/dashboard/bank-soal/page.tsx`**:
   - Ganti pengambilan data dari mengambil individual `questions` (`/api/bank-soal`) menjadi mengambil daftar `assessments` (`/api/assessments`).
   - Buat tampilan utama berupa grid kartu **"Paket Soal"**:
     - Menampilkan judul default (misalnya _"Paket Soal [Tipe] - [Kesulitan]"_ atau rangkuman teks input).
     - Menampilkan statistik ringkas per paket (jumlah soal, tingkat kesulitan, tipe soal, tanggal pembuatan).
     - Tombol aksi: `Buka Paket` dan `Hapus Paket`.
   - Tambahkan sistem pencarian/filter di bagian atas daftar paket (cari berdasarkan tipe soal atau tingkat kesulitan).
   - **Tampilan Detail Paket (Modal atau Split View):**
     - Ketika tombol `Buka Paket` diklik, buka sebuah modal detail atau rute dinamis (bisa juga state internal demi performa instan) yang menampilkan daftar utuh butir soal dalam paket tersebut.
     - Di dalam detail paket ini, user dapat:
       - Mengedit teks soal & kunci jawaban menggunakan `QuestionCard`.
       - Menghapus butir soal tertentu dalam paket.
       - Menambahkan butir soal baru.
       - Ekspor paket ke Word/PDF (saat ini mock).

## 4. Dependencies (Dependensi)

Tidak ada pustaka eksternal baru yang perlu diinstal. Kita akan menggunakan library UI Tailwind CSS + Lucide React + Shadcn Components yang sudah tersedia.

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **User belum memiliki paket soal**: Tampilkan ilustrasi/pesan kosong yang menarik (_"Belum ada Paket Soal yang tersimpan. Mulai buat soal di Dashboard!"_) dengan tombol CTA yang mengarahkan ke dashboard generator.
- **Paginasi & Infinite Scroll**: Pastikan status loading (skeleton loader) berjalan mulus ketika berpindah halaman atau me-load lebih banyak paket.
- **Penghapusan Paket**: Tampilkan konfirmasi `showConfirm` yang aman sebelum menghapus satu paket penuh demi menghindari kehilangan data yang tidak disengaja.
