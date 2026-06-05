# Planning - Refinement Komponen QuestionCard

## 1. Objective (Tujuan)

Menyempurnakan komponen `QuestionCard` (`src/components/dashboard/QuestionCard.tsx`) agar lebih fleksibel dalam mengedit soal panjang:

1. **Mengubah input soal menjadi Textarea:** Input utama teks soal diubah dari `<Input>` menjadi `<Textarea>` agar guru dapat mengedit soal panjang/berparagraf dengan nyaman.
2. **Kondisional Textarea untuk Pilihan & Kunci Isian:** Input pilihan jawaban (pilihan ganda) dan kunci jawaban isian singkat secara otomatis menggunakan `<Textarea>` jika teksnya melebihi 50 karakter, selebihnya menggunakan `<Input>` biasa.
3. **Pemberitahuan Update Hanya Jika Berubah:** Tombol simpan hanya akan men-trigger fungsi `onUpdate` (yang memicu penyimpanan ke DB dan alert sukses) jika memang ada perubahan nyata pada teks soal, pilihan jawaban, atau kunci jawaban dibanding properti asli. Jika tidak ada perubahan, menutup mode edit langsung tanpa hit API/alert.
4. **Tombol & Logika Reset:** Menambahkan tombol "Reset" (Reset / Undo) yang hanya muncul saat dalam mode edit dan terdeteksi ada perubahan dibanding data asli. Tombol ini akan mengembalikan seluruh state edit kembali ke nilai asli properti `question`.

---

## 2. Affected Files (File yang Terpengaruh)

- [x] `src/components/dashboard/QuestionCard.tsx` (Implementasi perubahan input ke textarea, validasi perubahan nyata, tombol reset, dan textareas dinamis > 50 karakter)

---

## 3. Implementation Steps (Langkah-Langkah Implementasi)

### Step 1: Memperbarui Impor di `src/components/dashboard/QuestionCard.tsx`

- Hapus impor `<Input>` jika tidak digunakan lagi, atau tetap gunakan untuk input yang <= 50 karakter.
- Impor komponen `<Textarea>` dari `@/components/ui/textarea`.
- Impor ikon `Undo` atau `RotateCcw` dari `lucide-react` untuk tombol reset.

### Step 2: Implementasi Deteksi Perubahan & Fungsi Reset

- Buat fungsi pembantu `checkHasChanges()` untuk memeriksa apakah nilai state edit saat ini berbeda dari properti `question`:
  ```typescript
  const hasChanges =
    questionText !== question.questionText ||
    answerKey !== question.answerKey ||
    JSON.stringify(options) !== JSON.stringify(question.options);
  ```
- Buat fungsi `handleReset()` yang akan mengatur ulang state ke nilai properti asal:
  ```typescript
  const handleReset = () => {
    setQuestionText(question.questionText);
    setOptions(question.options);
    setAnswerKey(question.answerKey);
  };
  ```

### Step 3: Implementasi Penyimpanan Selektif (`handleSave`)

- Pada fungsi `handleSave`:
  - Jika `hasChanges` bernilai `true`, panggil `onUpdate(...)` dengan data terbaru.
  - Jika `hasChanges` bernilai `false`, langsung panggil `setIsEditing(false)` tanpa memanggil `onUpdate`, sehingga tidak memicu hit API atau alert sukses yang tidak perlu di komponen parent.

### Step 4: Penyesuaian UI & Input / Textarea Dinamis

- Ganti input teks soal dengan `<Textarea className="min-h-[80px]" ... />`.
- Pada input Pilihan Jawaban (Multiple Choice) dan Kunci Jawaban Isian (Short Answer):
  - Jika panjang karakter teks state tersebut lebih dari 50 karakter (`text.length > 50`), render menggunakan `<Textarea ... />`.
  - Jika kurang dari atau sama dengan 50 karakter, render menggunakan `<Input ... />`.
- Tambahkan tombol **Reset** (menggunakan icon `RotateCcw` atau teks "Reset" dengan tombol outline) di sebelah kiri tombol **Simpan** ketika mode edit aktif dan `hasChanges` bernilai `true`.

---

## 4. Dependencies (Dependensi)

Tidak ada dependensi baru yang diperlukan. Komponen `<Textarea>` sudah terinstal di proyek.

---

## 5. Edge Cases & Error Handling (Kasus Batas & Penanganan Error)

- **Sinkronisasi State Setelah Update:** Jika properti `question` berubah dari luar setelah berhasil di-save, pastikan state lokal ter-update (akan menggunakan `useEffect` opsional untuk mensinkronkan properti `question` jika prop berubah).
