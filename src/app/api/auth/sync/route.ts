import { NextResponse } from "next/server";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adapter = new PrismaMariaDb({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as unknown as number,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,

  allowPublicKeyRetrieval: true,
});

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
    const prisma = new PrismaClient({
      adapter,
    });

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
    console.log("BACA ERROR INI:", error);
    console.error("Auth sync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", message: errorMessage },
      { status: 500 },
    );
  }
}
