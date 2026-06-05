import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// Mencegah pembuatan instance PrismaClient berulang kali selama hot-reloading di mode development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as unknown as number,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,

  allowPublicKeyRetrieval: true,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Menampilkan log query di terminal saat mode development (opsional, sangat membantu untuk debugging)
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
