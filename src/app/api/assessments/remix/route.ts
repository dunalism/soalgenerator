import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, questionIds } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Missing userId." },
        { status: 401 },
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul paket baru diperlukan." },
        { status: 400 },
      );
    }

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Tidak ada butir soal yang dipilih." },
        { status: 400 },
      );
    }

    // Start a transaction to ensure atomic creation of Assessment and Questions/Options
    const newAssessment = await prisma.$transaction(async (tx) => {
      // 1. Fetch original questions with options to clone them
      const originalQuestions = await tx.question.findMany({
        where: {
          id: { in: questionIds },
        },
        include: {
          options: true,
        },
      });

      if (originalQuestions.length === 0) {
        throw new Error("Butir soal yang dipilih tidak ditemukan di database.");
      }

      // Determine overall question type based on selected questions
      const uniqueTypes = Array.from(
        new Set(originalQuestions.map((q) => q.type)),
      );
      let questionType:
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "SHORT_ANSWER"
        | "MIXED" = "MIXED";
      if (uniqueTypes.length === 1) {
        if (uniqueTypes[0] === "MULTIPLE_CHOICE")
          questionType = "MULTIPLE_CHOICE";
        else if (uniqueTypes[0] === "TRUE_FALSE") questionType = "TRUE_FALSE";
        else if (uniqueTypes[0] === "SHORT_ANSWER")
          questionType = "SHORT_ANSWER";
      }

      // 2. Create the new parent Assessment record
      const assessment = await tx.assessment.create({
        data: {
          userId,
          inputType: "TEXT",
          title: title.trim(),
          questionType: questionType,
          questionCount: originalQuestions.length,
          difficulty: "MEDIUM",
        },
      });

      // 3. Clone each question & options
      for (let i = 0; i < originalQuestions.length; i++) {
        const origQ = originalQuestions[i];

        await tx.question.create({
          data: {
            assessmentId: assessment.id,
            questionText: origQ.questionText,
            type: origQ.type,
            order: i + 1,
            answerKey: origQ.answerKey,
            options:
              origQ.type === "MULTIPLE_CHOICE" &&
              origQ.options &&
              origQ.options.length > 0
                ? {
                    create: origQ.options.map((opt) => ({
                      optionText: opt.optionText,
                      isCorrect: opt.isCorrect,
                    })),
                  }
                : undefined,
          },
        });
      }

      return assessment;
    });

    return NextResponse.json({ success: true, id: newAssessment.id });
  } catch (error: unknown) {
    console.error("Kompilasi remix error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
