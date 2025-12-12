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

    // Execute blog tables migration
    const { error: tablesError } = await supabase.rpc("exec_sql", {
      sql: blogTablesMigration,
    });

    if (tablesError) {
      // Try direct SQL execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ sql: blogTablesMigration }),
      });

      if (!response.ok) {
        console.log("RPC not available, will return SQL for manual execution");
        return NextResponse.json({
          message: "Please run these SQL migrations manually in Supabase Studio",
          note: "Go to http://localhost:54323 > SQL Editor and run the migrations",
          migrations: [
            {
              name: "20251212000000_create_blog_tables.sql",
              sql: blogTablesMigration,
            },
            {
              name: "20251212000001_create_blog_storage.sql",
              sql: blogStorageMigration,
            },
          ],
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migrations executed successfully"
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    );
  }
}
