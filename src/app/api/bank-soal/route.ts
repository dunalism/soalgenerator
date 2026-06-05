import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch paginated questions for the given user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Missing userId." },
        { status: 400 },
      );
    }

    const page = Number(searchParams.get("page") || "1");
    const limit = 5;
    const skip = (page - 1) * limit;

    // Fetch questions for the given user through their assessments
    const questions = await prisma.question.findMany({
      where: {
        assessment: {
          userId: userId,
        },
      },
      include: {
        options: true,
        assessment: {
          select: {
            inputType: true,
            questionType: true,
            difficulty: true,
            rawInputText: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    const totalCount = await prisma.question.count({
      where: {
        assessment: {
          userId: userId,
        },
      },
    });

    const hasMore = skip + questions.length < totalCount;

    return NextResponse.json({
      success: true,
      questions,
      nextPage: hasMore ? page + 1 : null,
      hasMore,
    });
  } catch (error: unknown) {
    console.error("Fetch bank-soal error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}

// PUT - Update a single question
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, questionText, type, options, answerKey } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing question ID." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Update the question
      await tx.question.update({
        where: { id },
        data: {
          questionText,
          answerKey,
        },
      });

      // Update the options if multiple choice
      if (type === "MULTIPLE_CHOICE" && options && Array.isArray(options)) {
        for (const opt of options) {
          await tx.option.update({
            where: { id: opt.id },
            data: {
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Update single question error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE - Delete a single question
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing question ID." },
        { status: 400 },
      );
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete question error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
