# Rencana Kerja: Implementasi Opsi B (Dashboard Utama & Sub-Rute Generator Terpisah)

## 1. Objective (Tujuan)

Merestrukturisasi rute `/dashboard` sesuai prinsip SOLID (SRP) menjadi:

1. **`/dashboard`**: Bertindak sebagai Control Center (Hub Utama) yang menampilkan statistik aktivitas pengguna (jumlah paket, jumlah soal, distribusi tipe), riwayat 3 generasi terakhir (menggunakan `<AssessmentCard />`), dan tombol mencolok `[+ Buat Soal Baru]`.
2. **`/dashboard/generate`**: Halaman khusus untuk pembuatan soal baru (wizard, OCR, konfigurasi, AI generator).
3. **API Baru `/api/dashboard/stats`**: Endpoint untuk mengambil ringkasan statistik agregat dan riwayat generasi terakhir milik user tertentu.

## 2. Affected Files (File yang Terpengaruh)

- `src/app/api/dashboard/stats/route.ts` (File baru: Endpoint API statistik & riwayat ringkas)
- `src/app/dashboard/generate/page.tsx` (File baru: Memindahkan seluruh logika wizard pembuatan soal dari `/dashboard/page.tsx`)
- `src/app/dashboard/page.tsx` (Tulis ulang: Mengubah dashboard menjadi Hub Statistik & Riwayat)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Tahap 1: API Statistik Baru (`src/app/api/dashboard/stats/route.ts`)

1. **Buat file baru `src/app/api/dashboard/stats/route.ts`**:
   - Terima query parameter `userId`.
   - Gunakan Prisma untuk melakukan aggregasi data:
     - Hitung jumlah paket (`Assessment` count).
     - Hitung total butir soal (`Question` count).
     - Hitung distribusi tipe kesulitan (`EASY`, `MEDIUM`, `HARD`) atau tipe soal (`MULTIPLE_CHOICE`, dll) jika diinginkan.
     - Ambil 3 `Assessment` terbaru milik user (termasuk count questions) sebagai "Riwayat Terakhir".
   - Kembalikan response JSON berisi statistik agregat dan array riwayat terbaru.

### Tahap 2: Pemindahan Wizard Pembuat Soal (`src/app/dashboard/generate/page.tsx`)

2. **Buat file baru `src/app/dashboard/generate/page.tsx`**:
   - Salin seluruh konten dari `src/app/dashboard/page.tsx` (wizard form, OCR, state management, Progress bar, dll).
   - Pastikan navigasi `router.push` setelah generate mengarah ke `/dashboard/assessment/[id]`.

### Tahap 3: Re-write Dashboard Utama (`src/app/dashboard/page.tsx`)

3. **Tulis ulang `src/app/dashboard/page.tsx`**:
   - Pasang listener authentication Firebase `onAuthStateChanged`.
   - Lakukan fetch data statistik dan riwayat dari `/api/dashboard/stats?userId=[uid]`.
   - Rancang tampilan dashboard utama yang memukau:
     - **Hero Section:** Salam hangat (_"Selamat Datang kembali, [Nama]!"_) disertai deskripsi asisten AI.
     - **Tombol Utama:** Button besar yang menarik `[+ Buat Soal Baru dengan AI]` yang mengarahkan ke `/dashboard/generate`.
     - **Statistik Panel:** 3 kartu metrik horizontal (Total Paket, Total Soal, Metode Input Terbanyak/Rata-rata).
     - **Recent History Section:** Grid berisi 3 kartu riwayat terakhir dengan mengimpor dan menggunakan komponen `<AssessmentCard />` (me-reuse fungsionalitas edit & delete secara instan!).

## 4. Dependencies (Dependensi)

Tidak ada dependensi eksternal baru.

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **User Baru (Data Kosong)**: Tampilkan visualisasi statistik bernilai `0` dan info riwayat kosong yang bersahabat (_"Anda belum membuat paket soal apa pun."_) dengan tombol pemicu mengarah langsung ke `/dashboard/generate`.
- **Firebase Auth Delay**: Pastikan loader spinner yang mulus saat inisialisasi autentikasi sebelum memuat dashboard statistik.
