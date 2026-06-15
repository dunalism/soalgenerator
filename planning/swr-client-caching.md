# Rencana Implementasi Client-Side Caching dengan SWR

Dokumen perencanaan ini merinci arsitektur dan langkah-langkah implementasi perpindahan (migrasi) mekanisme fetching data dari fetch manual di `useEffect` menjadi client-side caching menggunakan **SWR** (Stale-While-Revalidate) di halaman Bank Soal dan Detail Asesmen.

## 1. Objective (Tujuan)

- **Eliminasi Fetch Berulang (Over-fetching):** Mencegah aplikasi melakukan hit API database secara berulang-ulang setiap kali berpindah halaman.
- **Peningkatan UX yang Signifikan:** Menghadirkan navigasi antar halaman yang instan (0 jeda loading) bagi guru saat mengelola ratusan butir soal.
- **Stabilitas & Sinkronisasi Data (Revalidation):** Menjamin data di client tetap mutakhir secara real-time dengan latar belakang revalidasi otomatis tanpa mengganggu kenyamanan pengguna.

## 2. Affected Files (Berkas yang Terpengaruh)

- [ ] `package.json` (Menambahkan dependensi `swr`)
- [ ] `src/lib/fetcher.ts` (Membuat utilitas fetcher global)
- [ ] `src/app/dashboard/bank-soal/page.tsx` (Refaktor fetching dengan `useSWR` / `useSWRInfinite` untuk pagination)
- [ ] `src/app/dashboard/assessment/[id]/page.tsx` (Refaktor fetching detail asesmen dengan `useSWR`)

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Langkah 1: Instalasi SWR

Menginstal library `swr` melalui terminal:

```bash
pnpm add swr
```

### Langkah 2: Membuat Global Fetcher Utility (`src/lib/fetcher.ts`)

Membuat utilitas fetcher yang aman untuk menangani HTTP request dan response error:

```typescript
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(
      errorData.error || "Terjadi kesalahan saat memuat data.",
    );
    throw error;
  }
  return res.json();
};
```

### Langkah 3: Integrasi SWR di Detail Asesmen (`src/app/dashboard/assessment/[id]/page.tsx`)

- Menggantikan state manual `questions`, `assessmentData`, `loading` dengan hook `useSWR`:

  ```typescript
  import useSWR, { useSWRConfig } from "swr";
  import { fetcher } from "@/lib/fetcher";

  const { data, error, isLoading, mutate } = useSWR(
    `/api/assessments/${id}`,
    fetcher,
  );
  ```

- Saat user mengedit atau menghapus soal dan menyimpannya ke database via `handleSaveToBankSoal`, panggil `mutate()` secara lokal untuk mengupdate cache lokal tanpa perlu melakukan fetch utuh dari server (optimistic UI update).

### Langkah 4: Integrasi SWR di Bank Soal (`src/app/dashboard/bank-soal/page.tsx`)

Karena halaman Bank Soal menggunakan fitur Infinite Scroll, kita dapat menggunakan **`useSWRInfinite`** dari package `swr/infinite`.

- Konfigurasi `getKey` untuk menampung parameter pencarian (`searchQuery`), tipe (`selectedType`), kesulitan (`selectedDifficulty`), serta halaman (`page`).
- SWR akan mengurus akumulasi data dari halaman 1 hingga halaman aktif secara otomatis.
- Saat salah satu paket soal dihapus via `handleDeleteAssessment`, kita akan memicu mutasi lokal pada cache `useSWRInfinite` sehingga kartu tersebut menghilang dari UI secara instan sebelum server mengonfirmasi penghapusan (Optimistic Update).

## 4. Dependencies (Dependensi)

- `swr` (v2.x.x - kompatibel penuh dengan React 19 / Next.js 16)

## 5. Edge Cases & Error Handling (Penanganan Kasus Khusus)

- **Kondisi Offline / Kehilangan Koneksi:** SWR secara bawaan memiliki fitur `revalidateOnReconnect`. Jika koneksi terputus dan kembali tersambung, SWR akan otomatis menyegarkan data di latar belakang.
- **Handling Error Toast:** Jika SWR melempar error, kita akan menampilkan AlertDialog/Toast melalui context `useDialog` yang sudah kita miliki, alih-alih merusak seluruh visual halaman (graceful degradation).
- **Tab Focus Sync:** Jika pengguna membuka tab lain untuk melihat dokumen kurikulum lalu kembali ke aplikasi kita, SWR akan melakukan revalidasi otomatis untuk memastikan data bank soal tidak usang.

---

## Pernyataan Persetujuan

Apakah rencana arsitektur caching ini sudah sesuai dengan ekspektasi Anda? Silakan balas dengan **"lanjut"**, **"ok"**, atau **"eksekusi"** untuk memulai pengerjaan!
