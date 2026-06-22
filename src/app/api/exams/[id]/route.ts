import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH - Mengupdate status aktif/nonaktif sesi ujian (Tutup Ujian)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "Parameter 'isActive' wajib disertakan." },
        { status: 400 },
      );
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: { isActive: !!isActive },
    });

    return NextResponse.json({
      success: true,
      message: `Status ujian berhasil diperbarui menjadi ${isActive ? "Aktif" : "Nonaktif/Ditutup"}.`,
      data: exam,
    });
  } catch (error) {
    console.error("Error patching exam:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Menghapus sesi ujian dan menghapus file statis JSON-nya
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Ambil data token sebelum dihapus di database
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { token: true },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Sesi ujian tidak ditemukan." },
        { status: 404 },
      );
    }

    const { token } = exam;

    // 2. Hapus data dari database (cascade onDelete terpasang pada skema Prisma)
    await prisma.exam.delete({
      where: { id },
    });

    // 3. Hapus file statis JSON di public/exams/[token].json jika ada
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        "exams",
        `${token}.json`,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      // Abaikan error file I/O agar proses delete record tidak gagal jika file tidak sengaja terhapus
      console.warn(
        `Gagal menghapus file statis /public/exams/${token}.json:`,
        fileError,
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Sesi ujian CBT beserta seluruh data pengerjaan siswa dan file statis berhasil dihapus.",
    });
  } catch (error) {
    console.error("Error deleting exam:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
