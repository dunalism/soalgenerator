# Planning - Implementasi Rute Bank Soal dengan Circular Pagination

## 1. Objective (Tujuan)

Membuat halaman Bank Soal di dalam rute dashboard (`/dashboard/bank-soal`) beserta antarmuka penggunanya (UI) yang menampilkan daftar soal yang telah dibuat oleh guru. Sesuai instruksi, data soal dibatasi hanya **5 soal per halaman/muatan**, dan navigasi halamannya menggunakan **circular pagination (infinite scroll / load on scroll)** ketika pengguna melakukan scroll ke bawah, alih-alih menggunakan tombol angka halaman biasa.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/app/api/bank-soal/route.ts` (API Endpoint baru untuk mengambil data soal pengguna secara terpaginasi)
- [x] `src/app/dashboard/bank-soal/page.tsx` (Halaman utama Bank Soal dengan fitur infinite scroll dan render daftar soal)
- [x] `src/app/dashboard/layout.tsx` (Tambahkan navigasi menuju Bank Soal pada Navbar utama jika diperlukan agar akses rute rapi)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Membuat API Endpoint `/api/bank-soal/route.ts`

- Menerima query parameter: `userId` dan `page` (untuk kalkulasi skip/offset) dengan `limit=5`.
- Mengambil data dari tabel `Question` yang berelasi dengan `Assessment` milik `userId` tertentu.
- Menyertakan relasi `options` (pilihan jawaban) dan informasi `assessment` (materi) agar konteks soal jelas.
- Menghitung total data dan menentukan apakah masih ada halaman berikutnya (`hasMore`).
- Mengembalikan response JSON yang berisi: `success`, `questions`, `nextPage`, dan `hasMore`.

### Step 2: Membuat Halaman `/dashboard/bank-soal/page.tsx`

- Menjadikan halaman Client Component (`"use client"`).
- Mendengarkan status autentikasi melalui `onAuthStateChanged` Firebase Auth untuk mendapatkan `userId` guru yang aktif.
- Menyimpan state untuk: `questions`, `page`, `hasMore`, `loading`, dan `loadingMore`.
- Mengimplementasikan **Infinite Scroll** menggunakan `IntersectionObserver` bawaan browser (zero-dependency) melalui `sentinelRef` di bagian bawah daftar soal:
  - Ketika sentinel terlihat di layar dan `hasMore` bernilai `true`, halaman akan memicu fungsi `fetchMoreQuestions` untuk halaman berikutnya (`page + 1`).
- Merender daftar soal menggunakan komponen `QuestionCard` yang sudah tersedia (`@/components/dashboard/QuestionCard`).
- Menangani fungsi `onUpdate` (menyimpan edit soal ke DB) dan `onDelete` (menghapus soal dari DB) agar sinkron langsung dengan MySQL melalui API `/api/assessments/[id]`.

### Step 3: Memperbarui Header/Navbar di `src/app/dashboard/layout.tsx`

- Menambahkan tautan/tombol Navigasi ke rute `/dashboard/bank-soal` di Navbar Dashboard agar guru dapat dengan mudah berpindah antara halaman pembuat soal utama dengan halaman Bank Soal.

---

## 4. Dependencies (Dependensi)

Tidak ada paket tambahan yang perlu diinstal. Kita menggunakan native `IntersectionObserver` API yang didukung penuh oleh semua browser modern.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Belum Ada Soal:** Jika guru baru masuk dan belum pernah membuat asesmen, halaman akan menampilkan visualisasi kosong (_empty state_) yang interaktif.
- **Akhir Halaman:** Ketika semua soal sudah ditampilkan, sentinel di-disconnect dan ditampilkan teks informatif "Semua soal telah dimuat." di bagian bawah.
- **Perubahan Soal Secara Real-time:** Fitur edit dan hapus soal pada `QuestionCard` akan tetap berfungsi dengan baik dan mengirimkan request ke backend, serta memperbarui state lokal di halaman Bank Soal.
