import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import Tesseract from "tesseract.js";

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

    let finalInputText = rawInputText || "";

    // 1. If input type is IMAGE, perform OCR with Tesseract.js
    if (inputType === "IMAGE") {
      if (!imageUrl) {
        return NextResponse.json(
          { error: "Gambar materi pelajaran belum diunggah." },
          { status: 400 },
        );
      }

      try {
        // Extract base64 image data and convert to buffer
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        // Run Tesseract OCR in Indonesian + English
        const ocrResult = await Tesseract.recognize(imageBuffer, "ind+eng");
        finalInputText = ocrResult.data.text;

        if (!finalInputText || finalInputText.trim().length < 10) {
          return NextResponse.json(
            {
              error:
                "Gagal mendeteksi teks dari gambar materi pelajaran. Silakan unggah gambar materi pelajaran dengan tulisan yang lebih jelas.",
            },
            { status: 400 },
          );
        }
      } catch (ocrError: unknown) {
        console.error("Tesseract OCR Error:", ocrError);
        const errorMessage =
          ocrError instanceof Error ? ocrError.message : "Unknown error";
        return NextResponse.json(
          {
            error:
              "Terjadi kesalahan saat mengekstrak teks dari gambar menggunakan OCR.",
            details: errorMessage,
          },
          { status: 500 },
        );
      }
    } else {
      // Input type is TEXT
      if (!finalInputText || finalInputText.trim().length < 10) {
        return NextResponse.json(
          { error: "Materi input terlalu pendek untuk dianalisis oleh AI." },
          { status: 400 },
        );
      }
    }

    // 2. Create the Assessment record in MySQL (Save the final OCR or text)
    const assessment = await prisma.assessment.create({
      data: {
        userId,
        inputType: inputType === "IMAGE" ? "IMAGE" : "TEXT",
        rawInputText: finalInputText,
        imageUrl: inputType === "IMAGE" ? imageUrl : "",
        questionType: questionType || "MULTIPLE_CHOICE",
        questionCount: Number(questionCount) || 10,
        difficulty: difficulty || "MEDIUM",
      },
    });

    // 3. Call Gemini AI to generate structured questions
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
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Materi:\n${finalInputText}` }] },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Menerima respon kosong dari model Gemini AI.");
    }

    const parsedData = JSON.parse(responseText);
    const questionsList = parsedData.questions || [];

    // 4. Create all questions in the database
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
