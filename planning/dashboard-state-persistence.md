# Rencana Penanganan Persistensi State Dashboard & Soal

## 1. Masalah Utama

Saat ini, semua state pengerjaan di `/dashboard` (materi input, konfigurasi, dan daftar soal yang tergenerasi) disimpan di dalam **React State** lokal.

- **Dampak**: Jika pengguna melakukan _hard-refresh_ atau tidak sengaja menutup tab, seluruh data pengerjaan akan hilang seketika, dan UI akan tereset kembali ke langkah pertama (Tahap 1: Input). Hal ini menghasilkan pengalaman pengguna (UX) yang kurang memuaskan bagi Guru yang mungkin sedang dalam proses mengedit soal.

---

## 2. Solusi Alternatif

Kami mengusulkan dua solusi utama yang dapat diimplementasikan:

### Solusi A: Client-side Auto-Save (LocalStorage / SessionStorage)

Menyimpan state pengerjaan ke dalam penyimpanan browser (`localStorage` atau `sessionStorage`) secara otomatis setiap kali ada perubahan data.

- **Alur Kerja**:
  - Menyimpan `step`, `inputType`, `rawText`, `difficulty`, dan `questions` ke `localStorage` menggunakan `useEffect` setiap kali state berubah.
  - Saat komponen pertama kali dimuat (_mount_), baca `localStorage`. Jika ada pengerjaan yang belum selesai, pulihkan state secara instan.
  - Sediakan tombol "Mulai Baru" untuk membersihkan penyimpanan jika guru ingin membuat lembar pengerjaan baru.
- **Kelebihan**: Sangat ringan, cepat diimplementasikan, tidak membebani database MySQL dengan data draf kotor.
- **Kekurangan**: Tidak sinkron antar-perangkat.

### Solusi B: Server-side Routing & Draft Persistence (URL & DB-backed) - _Sangat Direkomendasikan_

Membawa pengerjaan draf langsung ke tingkat database dan memanfaat rute Next.js App Router (misal: `/dashboard/asesmen/[id]`).

- **Alur Kerja**:
  - Saat Guru menyelesaikan **Tahap 1 & 2**, data disimpan ke database MySQL sebagai draf kosong dengan status `DRAFT`.
  - Sistem kemudian me-redirect pengguna ke rute dinamis: `/dashboard/asesmen/[id]`.
  - Halaman tersebut membaca data soal langsung dari database. Jika halaman di-refresh, halaman akan tetap berada pada soal tersebut karena ID asesmen tercantum di URL.
- **Kelebihan**: Sangat aman, fully-persistent, ramah SEO/Bookmark, bisa diedit di perangkat lain, merupakan standar industri aplikasi web profesional.
- **Kekurangan**: Memerlukan penulisan API endpoint penanganan draf di database.

---

## 3. Rencana Implementasi Pilihan Utama (Solusi A)

Sebagai langkah tercepat dan paling efisien untuk uji coba fungsionalitas sebelum meluncurkan database penuh ke produksi, kami merekomendasikan **Solusi A** terlebih dahulu dengan tambahan integrasi pengaman.

### Langkah-langkah Pembuatan Code:

1. Membuat utilitas helper untuk mengamankan data lokal di `src/lib/storage.ts`.
2. Menghubungkan `src/app/dashboard/page.tsx` dengan hook penyimpanan lokal.
3. Menyediakan tombol "Reset Pengerjaan" pada UI agar Guru bisa menghapus draf lokal jika ingin membuat asesmen baru dari awal.
