import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      inputType,
      rawInputText,
      imageUrl,
      questionType,
      questionCount,
      difficulty,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Missing userId." },
        { status: 401 },
      );
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({});

    // 1. Create the Assessment record
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        inputType: inputType === "IMAGE" ? "IMAGE" : "TEXT",
        rawInputText: rawInputText || "",
        imageUrl: imageUrl || "",
        questionType: questionType || "MULTIPLE_CHOICE",
        questionCount: Number(questionCount) || 10,
        difficulty: difficulty || "MEDIUM",
      },
    });

    // 2. Compile realistic questions list based on configuration
    const questionsToCreate = [];

    if (questionType === "MULTIPLE_CHOICE" || questionType === "MIXED") {
      questionsToCreate.push(
        {
          questionText:
            "Planet manakah di tata surya kita yang dijuluki sebagai 'Planet Merah'?",
          type: "MULTIPLE_CHOICE",
          order: 1,
          answerKey: "Mars",
          options: {
            create: [
              { optionText: "Venus", isCorrect: false },
              { optionText: "Mars", isCorrect: true },
              { optionText: "Merkurius", isCorrect: false },
              { optionText: "Jupiter", isCorrect: false },
            ],
          },
        },
        {
          questionText:
            "Lapisan atmosfer bumi manakah yang berfungsi melindungi bumi dari radiasi ultraviolet berbahaya?",
          type: "MULTIPLE_CHOICE",
          order: 2,
          answerKey: "Stratosfer (Lapisan Ozon)",
          options: {
            create: [
              { optionText: "Mesosfer", isCorrect: false },
              { optionText: "Stratosfer (Lapisan Ozon)", isCorrect: true },
              { optionText: "Troposfer", isCorrect: false },
              { optionText: "Termosfer", isCorrect: false },
            ],
          },
        },
      );
    }

    if (questionType === "TRUE_FALSE" || questionType === "MIXED") {
      questionsToCreate.push(
        {
          questionText:
            "Matahari merupakan sebuah bintang raksasa yang menghasilkan energinya melalui reaksi fusi nuklir.",
          type: "TRUE_FALSE",
          order: 3,
          answerKey: "Benar",
        },
        {
          questionText:
            "Planet Jupiter memiliki permukaan padat yang mirip dengan permukaan Bumi.",
          type: "TRUE_FALSE",
          order: 4,
          answerKey: "Salah",
        },
      );
    }

    if (questionType === "SHORT_ANSWER" || questionType === "MIXED") {
      questionsToCreate.push(
        {
          questionText:
            "Sebutkan satelit alami terbesar yang mengitari planet Bumi kita!",
          type: "SHORT_ANSWER",
          order: 5,
          answerKey: "Bulan",
        },
        {
          questionText:
            "Apa nama galaksi spiral raksasa yang menjadi rumah bagi tata surya kita?",
          type: "SHORT_ANSWER",
          order: 6,
          answerKey: "Bima Sakti (Milky Way)",
        },
      );
    }

    // Limit questions created based on requested questionCount
    const slicedQuestions = questionsToCreate.slice(
      0,
      Number(questionCount) || 10,
    );

    // 3. Create all questions in the database
    for (const q of slicedQuestions) {
      await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          questionText: q.questionText,
          type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
          order: q.order,
          answerKey: q.answerKey,
          options:
            "options" in q
              ? (q.options as {
                  create: { optionText: string; isCorrect: boolean }[];
                })
              : undefined,
        },
      });
    }

    return NextResponse.json({ success: true, id: assessment.id });
  } catch (error: unknown) {
    console.error("Create assessment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
