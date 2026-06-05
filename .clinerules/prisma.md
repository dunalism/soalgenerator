# 🚨 STRICT PRISMA ORM GUIDELINES FOR NEXT.JS FULLSTACK 🚨

You are an expert Fullstack Engineer writing Prisma ORM code for a Next.js App Router environment using a MySQL database. You must strictly adhere to the following rules to maintain SOLID principles, prevent connection leaks, and ensure maximum performance.

## 1. THE GOLDEN RULE (SINGLETON INSTANCE ONLY)

**❌ FORBIDDEN:** NEVER instantiate `PrismaClient` directly inside any route handler, server action, or component.
DO NOT write `const prisma = new PrismaClient()`.
DO NOT dynamically import PrismaClient like `const { PrismaClient } = await import('@prisma/client')`. This causes "Too many connections" errors during Next.js hot-reloading.

**✅ MANDATORY:** ALWAYS import the globally cached Prisma instance from the `lib` folder.

```typescript
// ALWAYS DO THIS:
import { prisma } from "@/lib/prisma";
```

## 2. ERROR HANDLING & RESILIENCE

Never assume a database query will succeed. Always wrap Prisma queries in try-catch blocks, especially for mutations (POST, PUT, DELETE).

Handle specific Prisma error codes (e.g., P2002 for Unique Constraint Violation, P2025 for Record Not Found).

Return standard HTTP status codes (400, 404, 500) using NextResponse instead of crashing the server.

// Example of clean error handling:
try {
const newQuestion = await prisma.question.create({ data: payload });
return NextResponse.json(newQuestion, { status: 201 });
} catch (error) {
if (error.code === 'P2002') {
return NextResponse.json({ error: "Record already exists" }, { status: 409 });
}
return NextResponse.json({ error: "Database error" }, { status: 500 });
}

3. QUERY OPTIMIZATION (CLEAN DATA)
   Do not over-fetch data. Only request the columns the frontend actually needs.

Use the select property to limit returned fields.

Avoid N+1 query problems. Use the include property to fetch relational data (like User -> Assessments -> Questions) in a single query.

4. UPSERT FOR SYNCHRONIZATION
   When syncing data (like Firebase Auth syncing with MySQL), NEVER use the anti-pattern of "check if exists, then create or update".
   ✅ MANDATORY: Use Prisma's upsert method. It is atomic, cleaner, and prevents race conditions.

## 5. SEPARATION OF CONCERNS (SOLID PRINCIPLES)

Keep UI components 100% free from direct database calls. Components must call API routes or Server Actions.

If an API route (route.ts) becomes too large or the logic is reusable, extract the Prisma query logic into a separate service file (e.g., services/assessment.service.ts). Keep the API route responsible only for HTTP Request/Response handling.
