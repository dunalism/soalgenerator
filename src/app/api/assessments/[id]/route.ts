import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch Assessment by ID with Questions & Options
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            options: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, assessment });
  } catch (error: unknown) {
    console.error("Fetch assessment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}

// PUT - Update Questions & Options for an Assessment (Save to Bank Soal)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { questions } = body; // Array of edited Question objects

    // Verify assessment exists
    const assessmentExists = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessmentExists) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    // Wrap in transaction: clear old questions and insert new ones
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing questions (options are deleted automatically via Cascade delete)
      await tx.question.deleteMany({
        where: { assessmentId: id },
      });

      // 2. Re-create updated questions with their options
      if (questions && Array.isArray(questions)) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await tx.question.create({
            data: {
              assessmentId: id,
              questionText: q.questionText,
              type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
              order: i + 1,
              answerKey: q.answerKey,
              options:
                q.type === "MULTIPLE_CHOICE" &&
                q.options &&
                Array.isArray(q.options)
                  ? {
                      create: q.options.map(
                        (opt: { optionText: string; isCorrect: boolean }) => ({
                          optionText: opt.optionText,
                          isCorrect: opt.isCorrect,
                        }),
                      ),
                    }
                  : undefined,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Update assessment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE - Delete assessment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify assessment exists
    const assessmentExists = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessmentExists) {
      return NextResponse.json(
        { error: "Assessment not found." },
        { status: 404 },
      );
    }

    await prisma.assessment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete assessment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
