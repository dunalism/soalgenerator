import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { id, email, name } = await request.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: "Missing required fields: id and email" },
        { status: 400 },
      );
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Upsert user in MySQL using Prisma
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name,
      },
      create: {
        id,
        email,
        name,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error("Auth sync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
