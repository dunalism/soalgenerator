import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fungsi pembuat token alfanumerik 6 karakter yang unik dan aman dari tabrakan (collision-free)
async function generateUniqueToken(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Menghindari O, 0, I, 1 agar tidak membingungkan siswa
  let token = "";
  let isUnique = false;

  while (!isUnique) {
    token = "";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Cek tabrakan token di database
    const existing = await prisma.exam.findUnique({
      where: { token },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return token;
}

// POST - Membuat sesi ujian baru (Exam) dan menghasilkan berkas static JSON
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      assessmentId,
      title,
      duration,
      startTime,
      endTime,
      showLeaderboard = true,
      shuffleQuestions = false,
      shuffleOptions = false,
    } = body;

    // 1. Validasi Kehadiran Input Utama
    if (
      !userId ||
      !assessmentId ||
      !title ||
      duration === undefined ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error: "Data input tidak lengkap. Pastikan semua field wajib terisi.",
        },
        { status: 400 },
      );
    }

    // 2. Validasi Tipe Data Durasi
    const parsedDuration = parseInt(String(duration), 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return NextResponse.json(
        { error: "Durasi harus berupa angka bulat positif dalam menit." },
        { status: 400 },
      );
    }

    // 3. Validasi Keabsahan Tanggal
    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal startTime atau endTime tidak valid." },
        { status: 400 },
      );
    }

    if (parsedStart >= parsedEnd) {
      return NextResponse.json(
        {
          error:
            "Waktu mulai ujian (startTime) harus lebih awal daripada waktu selesai (endTime).",
        },
        { status: 400 },
      );
    }

    // 4. Validasi Kepemilikan Paket Soal (Assessment) oleh User
    const assessmentExists = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId: userId,
      },
    });

    if (!assessmentExists) {
      return NextResponse.json(
        {
          error:
            "Paket soal tidak ditemukan atau Anda tidak memiliki akses ke paket soal ini.",
        },
        { status: 403 },
      );
    }

    // 5. Membuat Token Ujian Unik
    const token = await generateUniqueToken();

    // 6. Menyimpan Data Sesi Ujian di Database
    const exam = await prisma.exam.create({
      data: {
        assessmentId,
        title: title.trim(),
        token,
        duration: parsedDuration,
        startTime: parsedStart,
        endTime: parsedEnd,
        isActive: true,
        showLeaderboard: !!showLeaderboard,
        shuffleQuestions: !!shuffleQuestions,
        shuffleOptions: !!shuffleOptions,
      },
    });

    // 7. Penarikan Data Soal & Opsi (Optimal, Mencegah N+1 Query)
    const assessmentWithQuestions = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: true,
          },
        },
      },
    });

    if (!assessmentWithQuestions) {
      return NextResponse.json(
        { error: "Gagal menarik data soal dari database." },
        { status: 500 },
      );
    }

    // 8. Sanitisasi Kunci Jawaban (Menjamin keamanan anti-cheat sisi siswa)
    const sanitizedQuestions = assessmentWithQuestions.questions.map(
      (question) => {
        return {
          id: question.id,
          type: question.type,
          questionText: question.questionText,
          order: question.order,
          options: question.options.map((option) => ({
            id: option.id,
            optionText: option.optionText,
          })),
        };
      },
    );

    // 9. Penulisan Berkas JSON Statis ke public/exams/[token].json
    const examsDir = path.join(process.cwd(), "public", "exams");
    fs.mkdirSync(examsDir, { recursive: true });

    const staticExamData = {
      examId: exam.id,
      title: exam.title,
      token: exam.token,
      duration: exam.duration,
      startTime: exam.startTime,
      endTime: exam.endTime,
      shuffleQuestions: exam.shuffleQuestions,
      shuffleOptions: exam.shuffleOptions,
      questions: sanitizedQuestions,
    };

    const filePath = path.join(examsDir, `${token}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(staticExamData, null, 2),
      "utf-8",
    );

    // 10. Kembalikan Respon Sukses
    return NextResponse.json(
      {
        success: true,
        message: "Sesi ujian CBT berhasil diaktifkan.",
        data: exam,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating exam session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
