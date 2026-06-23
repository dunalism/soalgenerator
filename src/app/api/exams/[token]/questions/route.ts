import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = false; // Cache permanen sampai di-revalidate secara manual

// Mengekspor token ujian yang sudah ada agar ter-pre-render saat build
export async function generateStaticParams() {
  try {
    const exams = await prisma.exam.findMany({
      select: { token: true },
    });
    return exams.map((exam) => ({
      token: exam.token,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// GET - Mengambil data soal ujian statis untuk siswa berdasarkan token
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

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

    if (!exam.isActive) {
      return NextResponse.json(
        { error: "Sesi ujian ini sudah ditutup atau tidak aktif." },
        { status: 403 },
      );
    }

    // 2. Sanitisasi Kunci Jawaban (Menjamin keamanan anti-cheat sisi siswa)
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

    // Kembalikan data ujian dalam format JSON statis yang ter-cache
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
