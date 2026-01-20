import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Read migration files
    const migrationsPath = join(process.cwd(), "supabase", "migrations");

    const blogTablesMigration = readFileSync(
      join(migrationsPath, "20251212000000_create_blog_tables.sql"),
      "utf-8"
    );

    const blogStorageMigration = readFileSync(
      join(migrationsPath, "20251212000001_create_blog_storage.sql"),
      "utf-8"
    );

    const recursionFixMigration = readFileSync(
      join(migrationsPath, "20260119000000_fix_infinite_recursion.sql"),
      "utf-8"
    );

    const comprehensiveFixMigration = readFileSync(
      join(migrationsPath, "20260119000001_comprehensive_recursion_fix.sql"),
      "utf-8"
    );

    // Execute migrations
    const migrationsToRun = [
      { name: "Blog Tables", sql: blogTablesMigration },
      { name: "Blog Storage", sql: blogStorageMigration },
      { name: "Recursion Fix", sql: recursionFixMigration },
      { name: "Comprehensive Recursion Fix", sql: comprehensiveFixMigration }
    ];

    const results = [];
    for (const m of migrationsToRun) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ sql: m.sql }),
      });
      results.push({ name: m.name, success: response.ok });
    }

    return NextResponse.json({
      success: true,
      message: "Migrations process completed",
      results
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}
