import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Ambil daftar Paket Soal (Assessments) ter-paginasi milik user tertentu
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
    const limit = Number(searchParams.get("limit") || "6");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const questionType = searchParams.get("questionType") || "";

    // Build Prisma query filter clauses
    const whereClause: {
      userId: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      questionType?:
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "SHORT_ANSWER"
        | "MIXED";
      OR?: Array<{
        rawInputText?: { contains: string };
        questions?: { some: { questionText: { contains: string } } };
      }>;
    } = {
      userId: userId,
    };

    if (difficulty) {
      whereClause.difficulty = difficulty as "EASY" | "MEDIUM" | "HARD";
    }

    if (questionType) {
      whereClause.questionType = questionType as
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "SHORT_ANSWER"
        | "MIXED";
    }

    if (search) {
      whereClause.OR = [
        {
          rawInputText: {
            contains: search,
          },
        },
        {
          questions: {
            some: {
              questionText: {
                contains: search,
              },
            },
          },
        },
      ];
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
        // Only fetch questions if searching, and only ones containing the search query
        questions: search
          ? {
              where: {
                questionText: {
                  contains: search,
                },
              },
              take: 2,
            }
          : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    const totalCount = await prisma.assessment.count({
      where: whereClause,
    });

    const hasMore = skip + assessments.length < totalCount;

    return NextResponse.json({
      success: true,
      assessments,
      totalCount,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    });
  } catch (error: unknown) {
    console.error("Fetch assessments error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}

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
      title,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Missing userId." },
        { status: 401 },
      );
    }

    if (!rawInputText || rawInputText.trim().length < 10) {
      return NextResponse.json(
        { error: "Materi input terlalu pendek untuk dianalisis oleh AI." },
        { status: 400 },
      );
    }

    // Check for Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Kunci API Gemini belum dikonfigurasi. Silakan tambahkan GEMINI_API_KEY di file .env Anda.",
        },
        { status: 500 },
      );
    }

    // 1. Create the Assessment record in MySQL (Saves the material text directly)
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        title: title || null,
        inputType: inputType === "IMAGE" ? "IMAGE" : "TEXT",
        rawInputText: rawInputText,
        imageUrl: inputType === "IMAGE" ? imageUrl : "",
        questionType: questionType || "MULTIPLE_CHOICE",
        questionCount: Number(questionCount) || 10,
        difficulty: difficulty || "MEDIUM",
      },
    });

    // 2. Call Gemini AI to generate structured questions
    const genAI = new GoogleGenerativeAI(apiKey);

    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        questions: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              questionText: { type: SchemaType.STRING },
              type: {
                type: SchemaType.STRING,
                description:
                  "Tipe soal: MULTIPLE_CHOICE, TRUE_FALSE, atau SHORT_ANSWER",
              },
              options: {
                type: SchemaType.ARRAY,
                description:
                  "Pilihan jawaban (wajib ada tepat 4 pilihan jika tipe soal MULTIPLE_CHOICE, kosongkan jika TRUE_FALSE atau SHORT_ANSWER)",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    optionText: { type: SchemaType.STRING },
                    isCorrect: { type: SchemaType.BOOLEAN },
                  },
                  required: ["optionText", "isCorrect"],
                },
              },
              answerKey: {
                type: SchemaType.STRING,
                description:
                  "Kunci jawaban. Jika MULTIPLE_CHOICE, harus sama persis dengan optionText dari pilihan yang benar. Jika TRUE_FALSE, nilainya wajib berupa 'Benar' atau 'Salah'. Jika SHORT_ANSWER, berisi teks jawaban singkat.",
              },
            },
            required: ["questionText", "type", "answerKey"],
          },
        },
      },
      required: ["questions"],
    };

    const systemPrompt = `Anda adalah seorang guru ahli pembuat asesmen pendidikan pintar.
Tugas Anda adalah membuat soal ujian berkualitas tinggi berdasarkan materi input teks yang diberikan oleh pengguna.

Aturan Pembuatan Soal:
1. Jumlah soal yang harus dihasilkan: ${questionCount} soal.
2. Tingkat kesulitan soal: ${difficulty} (EASY: Fokus pada ingatan dan pemahaman dasar, MEDIUM: Fokus pada aplikasi dan analisis menengah, HARD: Fokus pada HOTS - Higher Order Thinking Skills, evaluasi, dan analisis mendalam).
3. Tipe soal yang diminta: ${questionType}.
   - Jika 'MULTIPLE_CHOICE', hasilkan HANYA soal pilihan ganda. Setiap soal wajib memiliki tepat 4 pilihan jawaban ('options') di mana hanya ada 1 pilihan yang benar ('isCorrect' bernilai true). 'answerKey' harus sama persis dengan teks pilihan yang benar tersebut.
   - Jika 'TRUE_FALSE', hasilkan HANYA soal Benar/Salah. 'options' harus kosong, dan 'answerKey' harus berupa teks 'Benar' atau 'Salah'.
   - Jika 'SHORT_ANSWER', hasilkan HANYA soal isian/jawaban singkat. 'options' harus kosong, dan 'answerKey' berisi teks jawaban singkat yang tepat.
   - Jika 'MIXED', hasilkan kombinasi seimbang dari tipe-tipe soal di atas (Pilihan Ganda, Benar/Salah, dan Isian Singkat).
4. Semua teks soal, pilihan jawaban, dan kunci jawaban harus ditulis menggunakan Bahasa Indonesia yang baik, benar, baku, dan sesuai dengan materi input.
5. Hasilkan soal yang relevan, mendidik, dan terstruktur dengan baik sesuai dengan data materi.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Materi:\n${rawInputText}` }] },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Menerima respon kosong dari model Gemini AI.");
    }

    const parsedData = JSON.parse(responseText);
    const questionsList = parsedData.questions || [];

    // 3. Create all questions in the database
    for (let i = 0; i < questionsList.length; i++) {
      const q = questionsList[i];
      await prisma.question.create({
        data: {
          assessmentId: assessment.id,
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
