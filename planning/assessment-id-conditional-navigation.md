# Rencana Kerja: ProgressBar Kondisional & Navigasi Dinamis Rute Detail Assessment

## 1. Objective (Tujuan)

Menyembunyikan `ProgressBar` dan mengonfigurasi tombol "Kembali" agar mengarah ke `/dashboard/bank-soal` secara dinamis jika rute detail `/dashboard/assessment/[id]` dibuka melalui halaman Bank Soal. Sedangkan jika dibuka sesaat setelah proses pembuatan soal baru, ProgressBar tetap tampil dan tombol "Kembali" mengarah ke `/dashboard`.

## 2. Affected Files (File yang Terpengaruh)

- `src/app/dashboard/bank-soal/page.tsx` (Mengirimkan query parameter `?source=bank-soal` saat mengarahkan ke halaman detail)
- `src/app/dashboard/assessment/[id]/page.tsx` (Membaca query parameter `source` untuk menyembunyikan ProgressBar dan mengalihkan tombol kembali secara dinamis)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Tahap 1: Pengiriman Parameter di Bank Soal

1. **Modifikasi `src/app/dashboard/bank-soal/page.tsx`**:
   - Di bagian kartu Paket Soal, ubah tombol "Buka Paket" agar mengarahkan dengan parameter `?source=bank-soal`:
     ```typescript
     router.push(`/dashboard/assessment/${assessment.id}?source=bank-soal`);
     ```

### Tahap 2: Pembacaan Parameter & Logika Kondisional di Halaman Detail

2. **Modifikasi `src/app/dashboard/assessment/[id]/page.tsx`**:
   - Impor `useSearchParams` dari `next/navigation`:
     ```typescript
     import { useRouter, useSearchParams } from "next/navigation";
     ```
   - Inisialisasi hook search params:
     ```typescript
     const searchParams = useSearchParams();
     const source = searchParams.get("source");
     ```
   - Di bagian render JSX, sembunyikan ProgressBar jika `source === "bank-soal"`:
     ```typescript
     {source !== "bank-soal" && <ProgressBar currentStep="REVIEW" />}
     ```
   - Di komponen `<ReviewStep>`, ubah properti `onBack` agar dinamis:
     ```typescript
     onBack={() => {
       if (source === "bank-soal") {
         router.push("/dashboard/bank-soal");
       } else {
         router.push("/dashboard");
       }
     }}
     ```

## 4. Dependencies (Dependensi)

Tidak ada dependensi eksternal baru (menggunakan hook bawaan Next.js `next/navigation`).

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **Akses Langsung URL Tanpa Parameter**: Jika halaman `/dashboard/assessment/[id]` diakses langsung tanpa query parameter `source`, perilaku default akan mengasumsikan alur pembuatan baru (ProgressBar tampil, kembali mengarah ke `/dashboard`).
