# Planning - Refinement UX: Tombol "Simpan Perubahan" & Smart Hide Navbar

## 1. Objective (Tujuan)

Menyempurnakan alur pengalaman pengguna (UX) pada Dashboard:

1. **Pembaruan Tombol Simpan:** Karena soal yang otomatis tergenerasi oleh AI sudah otomatis tersimpan di MySQL sejak awal, tombol "Simpan ke Bank Soal" di halaman Review sering kali membingungkan. Kita akan mengubah fungsinya menjadi tombol **"Simpan Perubahan"** yang bersifat dinamis: hanya aktif/menyala ketika mendeteksi ada perubahan soal (edit teks, tambah soal baru, atau hapus soal). Jika soal belum diubah, tombol akan dinonaktifkan atau menunjukkan status "Tersimpan di Database".
2. **Smart Hide Navbar:** Mengubah Navbar Dashboard (`<header>`) menjadi fixed header yang akan menyembunyikan diri saat pengguna men-scroll halaman ke bawah (_scroll down_) dan muncul kembali secara instan dengan transisi mulus saat pengguna men-scroll ke atas (_scroll up_).

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/components/dashboard/ReviewStep.tsx` (Ubah label tombol menjadi "Simpan Perubahan", tambahkan deteksi perubahan state dibanding initial questions untuk men-toggle status keaktifan tombol)
- [x] `src/app/dashboard/assessment/[id]/page.tsx` (Kirim status perubahan dan kelola state initial questions dari database)
- [x] `src/app/dashboard/layout.tsx` (Implementasikan fungsionalitas fixed smart-scroll header menggunakan hooks React: `useEffect`, `useState` mendeteksi perubahan `window.scrollY`)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Modifikasi `src/app/dashboard/layout.tsx` (Smart Hide Navbar)

- Buat header menjadi `fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-card/95 backdrop-blur-sm shadow-sm border-b`.
- Gunakan state `showHeader` (default `true`) dan `lastScrollY` (default `0`).
- Di dalam `useEffect`, tambahkan listener event `"scroll"` ke `window`:
  - Jika `window.scrollY > lastScrollY && window.scrollY > 80`, set `showHeader` menjadi `false` (sembunyikan).
  - Jika `window.scrollY < lastScrollY`, set `showHeader` menjadi `true` (tampilkan).
  - Selalu perbarui `lastScrollY` dengan nilai `window.scrollY`.
- Tambahkan kelas dinamis ke `<header>`: `showHeader ? "translate-y-0" : "-translate-y-full"`.
- Berikan spacing padat pada elemen `<main>` (misalnya `pt-[80px]` atau `pt-20`) agar konten utama tidak tertutup oleh navbar yang kini menjadi fixed.

### Step 2: Modifikasi `src/components/dashboard/ReviewStep.tsx` (Tombol Simpan Perubahan Dinamis)

- Tambahkan prop baru: `hasChanges: boolean`.
- Ganti label tombol "Simpan ke Bank Soal" menjadi **"Simpan Perubahan"**.
- Jadikan tombol dinonaktifkan (`disabled={!hasChanges || isSaving}`) jika tidak ada perubahan terdeteksi pada soal.
- Jika `hasChanges` bernilai `false`, beri variasi tampilan tombol agar melambangkan status "Semua Perubahan Tersimpan" (opsional/outline ringan) dan jika `true` beri efek interaktif utama (misal tombol berwarna atau border menyala) untuk mengingatkan guru menyimpan perubahan mereka.

### Step 3: Modifikasi `src/app/dashboard/assessment/[id]/page.tsx` (Deteksi State Perubahan)

- Tambahkan state `initialQuestions` untuk menyimpan salinan murni dari database hasil GET request pertama kali.
- Buat fungsi pembantu `checkHasChanges()` untuk membandingkan apakah state `questions` saat ini berbeda dengan `initialQuestions`.
- Kirimkan properti `hasChanges` ke komponen `<ReviewStep />`.
- Setelah pengguna mengklik simpan perubahan dan request PUT berhasil, perbarui `initialQuestions` dengan state `questions` saat ini, sehingga tombol kembali ke status "Tersimpan" secara dinamis.

---

## 4. Dependencies (Dependensi)

Tidak ada dependensi baru yang perlu dipasang. Semuanya diimplementasikan dengan murni menggunakan API internal React.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Hard Refresh:** Jika halaman di-hardrefresh, state kembali bersih dan disinkronkan langsung dari data MySQL terbaru. `hasChanges` di-set ke `false`.
- **Scroll Halus pada Desktop/Mobile:** Pengondisian event listener scroll dirancang ringan agar tidak menyebabkan lag atau performa jank, terutama pada perangkat mobile dengan frame-rate tinggi.
