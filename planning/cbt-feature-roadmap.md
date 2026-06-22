# 🗺️ PETA JALAN PENGEMBANGAN FITUR CBT (COMPUTER BASED TEST)

## "0 Rupiah Pun Jadi! — Solusi Skala Enterprise dengan Infrastruktur Server Gratis"

Dokumen ini berfungsi sebagai panduan arsitektur komprehensif, panduan langkah demi langkah, dan referensi kontekstual untuk pengembangan fitur CBT di aplikasi ini. Dokumen ini dirancang khusus untuk mendukung konkurensi tinggi (30+ pengguna bersamaan) di atas database gratis berkapasitas rendah (seperti Filess.io atau MySQL free tier dengan limit 5-10 koneksi) tanpa mengeluarkan biaya sepeser pun.

---

## 📌 PRINSIP UTAMA ARSITEKTUR "0 RUPIAH"

1.  **Database-Free Exam Taking (Zero DB Query Saat Ujian)**:
    Database tidak boleh diakses sama sekali selama siswa mengerjakan ujian. Soal di-load sekali di awal, pengerjaan di-handle penuh oleh browser, dan dikirim sekali di akhir.
2.  **Next.js Server Static-JSON Serving**:
    Guna menghindari crash saat 30 siswa mem-fetch soal secara bersamaan di menit yang sama, server Next.js akan menghasilkan berkas JSON statis soal (tanpa kunci jawaban!) saat Guru mengaktifkan ujian. Siswa mengunduh file JSON ini secara statis, bypass Prisma dan MySQL seutuhnya.
3.  **Client-Side LocalStorage Safe-backup (Anti Hilang Jawaban)**:
    Setiap klik pilihan jawaban siswa langsung direkam di `localStorage` komputer masing-masing. Jika browser tertutup, komputer mati, atau mati lampu, progres 100% aman dan langsung dipulihkan saat dibuka kembali.
4.  **Jitter / Staggered Delay (Antrean Acak Cerdas)**:
    Siswa tidak mengirim jawaban bersamaan. Saat tombol selesai diklik atau timer habis, browser akan menunda pengiriman secara acak antara **0 s.d. 15 detik** di sisi client. Ini meratakan 30 request submit menjadi rata-rata hanya 2 request per detik, membuat MySQL Filess.io memprosesnya dengan sangat ringan.
5.  **Strict Server-Side Grading (Anti Contek / Inspect Element)**:
    Kunci jawaban tidak pernah dikirim ke komputer siswa. Browser hanya menyimpan soal dan opsi teks. Pencocokan kebenaran jawaban dan perhitungan skor dilakukan 100% di server Next.js setelah lembar jawaban terkumpul.

---

## 🔄 ALUR PENGGUNA (USER WORKFLOW)

### A. Alur Guru (Dashboard)

1.  Guru memilih paket soal (`Assessment`) yang sudah ada.
2.  Guru menekan tombol **"Aktifkan Ujian CBT"**.
3.  Guru memasukkan detail: Judul Ujian, Durasi (Menit), Waktu Mulai, dan Waktu Selesai.
4.  Sistem secara otomatis:
    - Membuat rekaman sesi ujian (`Exam`) di database MySQL.
    - Menghasilkan **Token Ujian** acak (contoh: `MAT-7X2`).
    - Menulis berkas static JSON berisi soal-soal ujian (tanpa kunci jawaban!) ke directory server: `public/exams/[exam-token].json`.
5.  Guru membagikan Token Ujian tersebut kepada siswa.
6.  Setelah ujian selesai, Guru dapat melihat statistik hasil ujian siswa di dashboard, melihat detail jawaban salah-benar per nomor, dan mengunduh rekapitulasi nilai.

### B. Alur Siswa (CBT Engine)

1.  Siswa membuka halaman publik `/cbt`.
2.  Siswa menginput: **Nama Lengkap**, **Nomor Absen/ID**, dan **Token Ujian**.
3.  Siswa menekan tombol **"Mulai Ujian"**.
4.  Aplikasi men-download file JSON statis soal berdasarkan Token yang diinput. **(0 query database!)**
5.  Sistem mendeteksi kecocokan token, mencatat waktu mulai, dan mem-backup soal ke `localStorage`.
6.  **Ujian Berlangsung**:
    - Tampilan full-screen bersih (tanpa sidebar atau navbar aplikasi).
    - Siswa mengerjakan soal satu demi satu (navigasi nomor soal).
    - Setiap kali siswa memilih/mengubah jawaban, data langsung tersinkronisasi di `localStorage`.
    - Timer berjalan di sisi client dengan pelacak delta waktu (anti kecurangan manipulasi jam lokal).
    - Disederhanakan deteksi koneksi: jika offline, muncul banner oranye tenang agar siswa tidak panik.
7.  **Selesai Ujian**:
    - Siswa menekan tombol selesai atau waktu habis (auto-submit).
    - Sistem menghitung penundaan acak (Jitter) antara 0-15 detik.
    - Sistem menampilkan status: _"Sedang mengantre menyimpan lembar jawaban (estimasi ... detik)..."_
    - Aplikasi menembakkan request batch `POST /api/exams/submit` berisi array jawaban siswa.
    - Jika server mengembalikan status sukses (`200 OK`), data `localStorage` dihapus dan siswa diarahkan ke halaman selesai.
    - **Penyelamat Offline**: Jika pengiriman gagal (misal internet mati total), lembar jawaban **TETAP disimpan di LocalStorage**. Pengguna dapat mengklik tombol **"Kirim Ulang"** setelah koneksi tersambung kembali, atau pengawas dapat mengekspor berkas penyelamat `.cbt` secara manual.

### C. Alur Papan Peringkat (Leaderboard Publik)

1.  **Halaman Daftar Ujian Selesai (`/leaderboard`)**:
    - Akses publik tanpa perlu login untuk memelihara keringanan server dan database.
    - Menampilkan seluruh ujian (`Exam`) yang **sudah berakhir** (waktu saat ini telah melewati `endTime` atau `isActive` diset `false` oleh Guru) **DAN** properti `showLeaderboard` bernilai `true`.
2.  **Halaman Papan Peringkat Detail (`/leaderboard/[token]`)**:
    - Saat siswa memilih salah satu ujian yang selesai, halaman beralih menampilkan daftar siswa yang diurutkan berdasarkan:
      - Skor tertinggi (`score` menurun / DESC).
      - Waktu penyelesaian tercepat (`submittedAt - startedAt` menaik / ASC) jika skornya sama.
    - Papan peringkat dilengkapi efek animasi podium yang seru guna memicu semangat persaingan belajar siswa secara sehat.

---

## 🛠️ TAHAPAN IMPLEMENTASI DETIL

### 📅 Tahap 1: Database & Migrasi (SELESAI ✅)

- [x] Menambahkan model `Exam`, `ExamAttempt`, dan `StudentAnswer` ke dalam `prisma/schema.prisma` dengan relasi cascade.
- [x] Menghubungkan relasi timbal balik di model `Assessment` dan `Question`.
- [x] Validasi skema Prisma (`npx prisma validate`).
- [x] Generate ulang Prisma Client (`npx prisma generate`).

---

### 🖥️ Tahap 2: API Pembuatan Ujian & Static JSON Generator (Guru)

Membuat API Endpoint bagi Guru untuk membuat ujian baru dan menghasilkan berkas static JSON.

- [ ] **API Route**: `POST /api/exams`
  - Menerima payload: `assessmentId`, `title`, `duration`, `startTime`, `endTime`, `showLeaderboard`.
  - Membuat token acak alfanumerik 6 karakter (unik).
  - Menyimpan data `Exam` di database MySQL (termasuk status toggle `showLeaderboard`).
  - Mengambil daftar soal dari paket `Assessment` terkait, membuang semua informasi kunci jawaban (`isCorrect` dan `answerKey`), lalu mengompres struktur datanya menjadi array JSON bersih.
  - Menyimpan file JSON statis di: `/public/exams/[token].json`.
  - _Contoh isi JSON statis_:
    ```json
    {
      "examId": "exam-uuid-xyz",
      "title": "Ujian Harian Matematika",
      "duration": 60,
      "questions": [
        {
          "id": "q-uuid-1",
          "type": "MULTIPLE_CHOICE",
          "questionText": "<p>Berapakah hasil dari 2 + 2?</p>",
          "options": [
            { "id": "o-1", "optionText": "3" },
            { "id": "o-2", "optionText": "4" }
          ]
        }
      ]
    }
    ```

---

### 📊 Tahap 3: UI Manajemen Sesi Ujian (Dashboard Guru)

Membangun antarmuka bagi Guru untuk mengelola sesi ujian.

- [ ] **Halaman SWR / Dashboard**: `/dashboard/exams`
  - Daftar sesi ujian aktif dan nonaktif yang telah dibuat guru.
  - Tombol _"Buat Sesi Ujian Baru"_ (membuka formulir/modal pemilihan paket soal dan isian durasi/token).
  - Menampilkan Token Ujian besar-besar agar mudah disalin atau ditampilkan di proyektor kelas.
  - Tombol _"Tutup Ujian"_ (untuk me-nonaktifkan status `isActive` sesi ujian secara paksa di DB).

---

### 🎨 Tahap 4: UI & Engine CBT Client-Side (Siswa)

Membangun halaman pelaksanaan ujian untuk siswa yang andal, offline-safe, dan bebas gangguan.

- [ ] **Halaman Login CBT**: `/cbt`
  - Formulir sederhana: Nama Lengkap, No Absen/NISN, Token Ujian.
  - Melakukan fetch static ke `/exams/[token].json` untuk mendeteksi keberadaan ujian secara instan tanpa query database.
- [ ] **Halaman Pelaksanaan Ujian**: `/cbt/[token]`
  - Menggunakan mode **Focus Mode**: Menyembunyikan seluruh sidebar/navbar dashboard guru.
  - Memiliki sidebar nomor navigasi soal (kotak-kotak nomor soal beralih warna: abu-abu = belum dijawab, biru = sudah dijawab, kuning = ragu-ragu).
  - Merender `RichTextEditor` dalam mode read-only (atau render HTML aman) untuk menampilkan soal yang mengandung format teks kaya dan gambar.
  - Sistem Timer mundur yang sinkron dengan backend, memicu auto-submit jika mencapai `00:00`.
  - Sistem auto-save berkala ke `localStorage` (Kunci: `cbt-attempt-[token]`).

---

### 🔒 Tahap 5: Keamanan & Server-Side Grading Engine

Membangun endpoint API penerimaan jawaban yang anti-cheat dan hemat database.

- [ ] **API Route**: `POST /api/exams/submit`
  - Menerima payload lembar jawaban batch siswa: `studentName`, `studentId`, `examToken`, `answers: [{ questionId, chosenOptionId, textAnswer }]`.
  - Lakukan throttling: kueri database untuk mengambil kunci jawaban asli berdasarkan `examToken`.
  - **Server-side Autograding Logic**:
    - Sistem otomatis mencocokkan `chosenOptionId` dengan opsi yang `isCorrect === true` dari database untuk Pilihan Ganda.
    - Sistem mencocokkan `textAnswer` (case-insensitive) untuk Benar/Salah.
    - Menghitung skor akhir dengan rumus standar: `(Jumlah Benar / Total Soal) * 100`.
  - Menyimpan entri usaha ujian siswa (`ExamAttempt`) dan rincian jawaban (`StudentAnswer[]`) dalam **satu transaksi kueri Prisma tunggal (Prisma Transaction)** untuk mencegah kebocoran koneksi DB.
  - Mengirimkan respons `200 OK` beserta nilai (atau pesan sukses).

---

### 💾 Tahap 6: Backup Offline & Fitur Penyelamat Pengawas (.cbt)

Fitur tanggap darurat jika koneksi internet sekolah lumpuh total di akhir sesi ujian.

- [ ] **Logika Enkripsi & Ekspor Berkas di Browser Siswa**:
  - Jika tombol kirim ditekan saat offline, aplikasi menampilkan modal penyelamatan.
  - Menyediakan tombol **"Ekspor Lembar Jawaban (.cbt)"**.
  - Browser men-download berkas JSON terenkripsi/ter-obfuscate sederhana (berisi data jawaban siswa).
- [ ] **Dashboard Pengawas (Dashboard Guru)**:
  - Guru memiliki menu **"Unggah Berkas Jawaban Manual (.cbt)"**.
  - Guru mengunggah file `.cbt` yang dikumpulkan dari flashdisk siswa.
  - Server Next.js mendekripsi file tersebut, menghitung nilai di server, dan menyimpannya di database MySQL. Ini menjamin **tidak ada siswa yang gagal ujian karena masalah infrastruktur sekolah!**

---

### 📈 Tahap 7: Dashboard Penilaian & Statistik Siswa (Guru)

Antarmuka bagi Guru untuk melihat, menganalisis, dan mengekspor hasil ujian.

- [ ] **Halaman Hasil Sesi**: `/dashboard/exams/[id]/results`
  - Menampilkan daftar siswa yang telah submit, waktu pengerjaan, skor akhir, dan status kelulusan.
  - Menampilkan statistik per nomor soal (misal: "Soal nomor 5 salah dijawab oleh 80% siswa" - ini sangat membantu guru mengetahui materi mana yang belum dipahami kelas).
  - Tombol ekspor data ke Excel / CSV untuk kebutuhan pelaporan nilai sekolah.

---

### 🏆 Tahap 8: Halaman Leaderboard Publik (Siswa)

Membangun antarmuka papan peringkat publik yang responsif tanpa beban login.

- [ ] **Halaman `/leaderboard`**:
  - Endpoint kueri ringan untuk menarik sesi `Exam` yang telah selesai (`isActive: false` atau `endTime < now`) dan memiliki `showLeaderboard: true`.
- [ ] **Halaman `/leaderboard/[token]`**:
  - Mengambil daftar peserta ujian dari `ExamAttempt` yang diurutkan berdasarkan skor tertinggi dan durasi tersingkat.
  - Tampilan modern dengan warna podium emas, perak, dan perunggu yang seru untuk siswa.

---

## 💡 CATATAN KHUSUS UNTUK KODE KONSISTEN & SOLU TION EMAS

- **Prisma Connection Throttling**:
  Karena server gratisan memiliki limit ketat, di file `prisma.config.ts` atau file koneksi database, pastikan Anda menambahkan batasan pool size:
  `DATABASE_URL="mysql://...&connection_limit=3&pool_timeout=15"`
  Ini memaksa Prisma mengantre kueri di sisi server Next.js alih-alih melempar error ke database MySQL.
- **Keamanan Waktu (Cheat-Proof Timer)**:
  Jangan hanya mengandalkan timer `setInterval` di client karena siswa bisa menghentikannya dengan menjeda debugger JavaScript atau mengganti jam Windows. Di awal ujian, catat `serverStartTime` dan hitung sisa durasi berdasarkan perbandingan delta `Date.now()` server asli dengan saat ini.
