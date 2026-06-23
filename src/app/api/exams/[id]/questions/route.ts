import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false; // Dikunci permanen di Edge CDN, HANYA diganti manual saat Guru bertindak

// Agar Token baru yang dibuat Guru setelah deploy tidak memicu 404
export const dynamicParams = true; // Mengizinkan On-Demand rendering untuk token baru

export async function generateStaticParams() {
  try {
    const exams = await prisma.exam.findMany({
      select: { token: true },
    });
    return exams.map((exam) => ({
      id: exam.token,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Token ujian tidak boleh kosong." },
        { status: 400 },
      );
    }

    // 1. Ambil data sesi ujian berdasarkan token beserta soal dan opsi
    const exam = await prisma.exam.findUnique({
      where: { token },
      include: {
        assessment: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Sesi ujian tidak ditemukan." },
        { status: 404 },
      );
    }

    // --- FITUR REAL-TIME VALIDATION TAPI TETAP CACHED ---
    // Pengecekan waktu dinamis (Siswa tidak bisa curang memanipulasi waktu lokal laptop mereka)
    const now = new Date();
    if (exam.endTime && now > new Date(exam.endTime)) {
      return NextResponse.json(
        { error: "Sesi ujian ini sudah kedaluwarsa/berakhir." },
        { status: 403 },
      );
    }

    if (!exam.isActive) {
      return NextResponse.json(
        { error: "Sesi ujian ini sudah ditutup atau tidak aktif." },
        { status: 403 },
      );
    }
    // ----------------------------------------------------

    // 2. Sanitisasi Kunci Jawaban (Sangat Bagus & Aman)
    const sanitizedQuestions = exam.assessment.questions.map((question) => {
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
    });

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

    return NextResponse.json(staticExamData);
  } catch (error) {
    console.error("Error fetching exam questions cache:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
