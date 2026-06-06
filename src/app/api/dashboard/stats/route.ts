import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // 1. Count total assessments (packages)
    const totalAssessments = await prisma.assessment.count({
      where: {
        userId: userId,
      },
    });

    // 2. Count total questions
    const totalQuestions = await prisma.question.count({
      where: {
        assessment: {
          userId: userId,
        },
      },
    });

    // 3. Get distribution of difficulty
    const easyCount = await prisma.assessment.count({
      where: {
        userId: userId,
        difficulty: "EASY",
      },
    });
    const mediumCount = await prisma.assessment.count({
      where: {
        userId: userId,
        difficulty: "MEDIUM",
      },
    });
    const hardCount = await prisma.assessment.count({
      where: {
        userId: userId,
        difficulty: "HARD",
      },
    });

    // 4. Fetch 3 latest assessments for recent history
    const recentAssessments = await prisma.assessment.findMany({
      where: {
        userId: userId,
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalAssessments,
        totalQuestions,
        difficultyDistribution: {
          EASY: easyCount,
          MEDIUM: mediumCount,
          HARD: hardCount,
        },
      },
      recentAssessments,
    });
  } catch (error: unknown) {
    console.error("Fetch dashboard stats error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
