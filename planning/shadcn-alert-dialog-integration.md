# Planning - Integrasi Reusable Shadcn AlertDialog & ConfirmDialog

## 1. Objective (Tujuan)

Mengganti semua penggunaan `alert()` dan `confirm()` bawaan browser (plain JS) yang kurang estetik dengan **Shadcn AlertDialog** yang bergaya modern dan profesional. Agar efisien dan menghindari boilerplate berlebihan di setiap halaman, kita akan membuat **reusable Dialog Context Provider & Hook** (`AlertDialogProvider` & `useDialog`), sehingga memanggil alert/confirm shadcn dapat dilakukan hanya dengan satu baris fungsi sederhana dari manapun di dalam aplikasi.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/components/ui/dialog-provider.tsx` (File baru: Menyediakan global Context Provider dan hook `useDialog()`)
- [x] `src/app/layout.tsx` (Membungkus aplikasi dengan `<AlertDialogProvider>` agar hook dapat dipanggil secara global)
- [x] `src/app/dashboard/assessment/[id]/page.tsx` (Mengganti plain alert dengan `showAlert`)
- [x] `src/app/dashboard/page.tsx` (Mengganti plain alert dengan `showAlert`)
- [x] `src/app/dashboard/bank-soal/page.tsx` (Mengganti plain alert dengan `showAlert` dan plain confirm dengan `showConfirm`)
- [x] `src/components/dashboard/InputStep.tsx` (Mengganti plain alert dengan `showAlert`)
- [x] `src/components/dashboard/ReviewStep.tsx` (Mengganti plain alert dengan `showAlert`)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Membuat Global Dialog Provider (`src/components/ui/dialog-provider.tsx`)

- Implementasikan Context React yang mengelola state dialog: `isOpen`, `title`, `description`, `isConfirm`, dan fungsi `onConfirmCallback`.
- Sediakan interface fungsi:
  - `showAlert(title, description)` -> Dialog satu tombol ("OK") untuk pesan informasi atau error.
  - `showConfirm(title, description, onConfirm)` -> Dialog dua tombol ("Batal" & "Ya, Lanjutkan") untuk konfirmasi aksi berbahaya seperti menghapus soal.
- Kembalikan komponen `<AlertDialog>` Shadcn dengan visual yang rapi sesuai pilihan aksinya.

### Step 2: Registrasi Global Provider (`src/app/layout.tsx`)

- Bungkus komponen `{children}` di dalam `<AlertDialogProvider>` tepat di bawah `ThemeProvider` agar tersedia di seluruh halaman Client Component.

### Step 3: Refaktor Seluruh Kode Halaman (Menggunakan `useDialog`)

- Impor hook `useDialog` di masing-masing file yang terpengaruh.
- Gantikan pemanggilan `alert("pesan")` menjadi `showAlert("Judul", "pesan")`.
- Gantikan logika:
  ```typescript
  if (confirm("Apakah Anda yakin?")) {
    doDelete();
  }
  ```
  Menjadi:
  ```typescript
  showConfirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus?", () => {
    doDelete();
  });
  ```

---

## 4. Dependencies (Dependensi)

Tidak ada dependensi baru yang diperlukan. Kita menggunakan modul `@/components/ui/alert-dialog` yang sudah tersedia di proyek.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Komponen Server vs Client:** Karena Dialog Context menggunakan state, hook `useDialog` hanya dapat dipanggil di komponen client (`"use client"`). Beruntung, semua komponen interaktif kita (`page.tsx` di dashboard, `ReviewStep`, `InputStep`) sudah dikonfigurasi sebagai client components.
- **Tumpukan Callback:** Callback untuk confirm disimpan dengan aman di state React agar dipanggil secara akurat setelah pengguna mengklik aksi setuju.
