# Perbaikan Error Tipe Schema Enum di Gemini AI

## 1. Objective

Memperbaiki error TypeScript pada schema generator di file `src/app/api/assessments/route.ts`. Error disebabkan oleh hilangnya properti `format: "enum"` pada skema string enum yang disyaratkan oleh tipe `EnumStringSchema` dalam SDK `@google/generative-ai`.

## 2. Affected Files

- [ ] `src/app/api/assessments/route.ts`

## 3. Implementation Steps

1. Menambahkan properti `format: "enum"` pada properti `type` di dalam `responseSchema`.
2. Melakukan verifikasi build untuk memastikan tidak ada lagi error TypeScript.

## 4. Dependencies

Tidak ada package baru yang perlu diinstal.

## 5. Edge Cases/Error Handling

Penambahan properti `format: "enum"` merupakan standar yang kompatibel dengan library `@google/generative-ai` versi terbaru, sehingga tidak mengubah jalannya program selain mengoreksi validasi tipe statis TypeScript.
