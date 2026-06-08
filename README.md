# SoalGenerator AI 🧠✨

**SoalGenerator AI** adalah platform asisten kecerdasan buatan (AI) canggih yang dirancang khusus untuk membantu guru, dosen, dan pengajar menyusun asesmen/soal ujian berkualitas tinggi secara instan dari materi pelajaran. Berbasis teknologi Fullstack Next.js (App Router), Prisma ORM, MySQL, Firebase Auth, dan didukung oleh kecerdasan model bahasa besar **Google Gemini 2.5 Flash**.

---

## 🚀 Fitur Utama

### 1. 🤖 Generasi Soal Pintar (AI-Powered)

- **Kustomisasi Parameter Penuh:** Atur jumlah soal, tingkat kesulitan (Easy, Medium, HOTS / Hard), dan judul paket asesmen Anda.
- **Mendukung Multi-Tipe Soal:** Hasilkan soal dengan tipe **Pilihan Ganda (PG)**, **Benar/Salah (B/S)**, **Uraian/Esai (Short Answer)**, **Menjodohkan (Matching)**, dan **Campuran (Mixed)**.
- **Pilihan Ganda Dinamis:** Atur jumlah pilihan jawaban untuk pilihan ganda secara fleksibel, baik **4 Pilihan (A-D)** maupun **5 Pilihan (A-E)**.

### 2. 📊 Panel Distribusi Soal Campuran (Mixed Distribution)

- Ketika memilih tipe soal **Campuran (Mixed)**, guru dapat mendistribusikan jumlah masing-masing tipe soal secara presisi (contoh: dari 20 soal total, diatur menjadi 5 PG, 5 B/S, 5 Menjodohkan, dan 5 Uraian).
- Dilengkapi dengan tombol **"Bagi Rata"** sekali klik dan counter penambah/pengurang yang interaktif.
- Validasi real-time untuk memastikan kecocokan jumlah sub-soal dengan total target soal demi mencegah bug generasi.

### 3. 📷 Pemindai Gambar Materi (Client-Side OCR)

- Unggah gambar dokumen, buku teks, atau catatan materi pelajaran langsung dari perangkat Anda.
- Menggunakan **Tesseract.js** untuk mengekstrak teks materi secara instan langsung di sisi klien (client-side) secara aman dan cepat.
- Fitur **Kompresi Gambar Otomatis** berbasis Canvas HTML5 untuk mengurangi beban bandwidth tanpa mengurangi akurasi pembacaan teks.

### 4. 🗄️ Bank Soal & Filter Butir Soal Pintar

- Semua paket asesmen yang berhasil dibuat disimpan secara aman dan persistent di database **MySQL** via **Prisma ORM**.
- **Filter Pencarian Hibrida:** Cari paket soal berdasarkan kata kunci materi atau butir pertanyaan.
- **Penyaringan Granular:** Saring bank soal berdasarkan Tingkat Kesulitan atau Tipe Soal.
- **Laci Detail & Seleksi Mandiri:** Ekspansi laci soal pada setiap paket untuk melihat butir-butir pertanyaan dan menyaring butir soal yang sesuai tipe pencarian di dalam paket Campuran.

### 5. 🛒 Remix Keranjang Soal (Smart Cart System)

- Pilih butir-butir soal terbaik secara individual dari berbagai paket soal di Bank Soal dan masukkan ke dalam **Keranjang Soal**.
- Gabungkan dan susun butir-butir soal pilihan tersebut menjadi satu paket soal kustom baru (Remix Paket) yang siap pakai.

### 6. 📄 Ekspor Native Microsoft Word (`.docx`) Berkualitas Tinggi

Ekspor paket soal Anda menjadi dokumen Word asli yang rapi, profesional, dan siap cetak dengan standar tipografi kelas satu menggunakan library `docx.js`:

- **Font Times New Roman 12pt Asli** di seluruh dokumen dan kunci jawaban.
- **Penomoran Asli Word dengan Inden Gantung (Hanging Indent) Presisi:** Menjamin nomor soal dan teks pertanyaan sejajar sempurna tanpa bertumpuk ketika teks panjang membungkus (wrap).
- **Pilihan Ganda 2-Kolom Sejajar:** Opsi jawaban yang ringkas otomatis dibagi rata secara horizontal menggunakan objek `Table` borderless resmi Word (a, b, c di kiri, d, e di kanan) tanpa khawatir bergeser.
- **Tabel Menjodohkan Resmi:** Membaca data pencocokan dan menampilkannya dalam tabel Word ber-border hitam yang rapi.
- **Page Break Resmi Microsoft Word:** Memisahkan Lembar Soal dan Lembar Kunci Jawaban secara tegas menggunakan objek `PageBreak` resmi.

---

## 🛠️ Tech Stack & Arsitektur

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** MySQL
- **ORM:** Prisma Client (Singleton Instance optimized to prevent connection leaks)
- **AI Model:** Google Gemini 2.5 Flash (`@google/generative-ai`)
- **Authentication:** Firebase Authentication
- **Client-side OCR:** Tesseract.js
- **Word Export:** docx.js
- **Styling:** Tailwind CSS, Lucide React (Icons), Radix UI

---

## 💻 Cara Menjalankan Project Secara Lokal

### Prasyarat

- Node.js versi terbaru (direkomendasikan v18+ atau v20+)
- PNPM Package Manager (`npm install -g pnpm`)
- Database MySQL aktif

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/dunalism/soalgenerator.git
cd soalgenerator
pnpm install
```

### 2. Konfigurasi Environment Variables (`.env`)

Buat file `.env` di root directory proyek dan sesuaikan nilainya:

```env
# Koneksi Database MySQL (Prisma)
DATABASE_URL="mysql://username:password@localhost:3306/soalgenerator"

# Kunci API Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key_here"

# Firebase Client Configuration (untuk firebase client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_app_id"
```

### 3. Migrasi Database & Prisma Generate

Jalankan migrasi database ke MySQL Anda dan generate Prisma Client types:

```bash
pnpm exec prisma db push
pnpm exec prisma generate
```

### 4. Jalankan Aplikasi di Mode Development

```bash
pnpm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda untuk mencoba aplikasi.

---

## 🤝 Lisensi & Berbagi

Dibuat dengan dedikasi penuh untuk meningkatkan kualitas pendidikan melalui bantuan kecerdasan buatan. Silakan berkontribusi, membuka issue, atau mengajukan pull-request untuk memajukan platform ini!
