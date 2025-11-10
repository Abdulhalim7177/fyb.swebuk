import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Swebuk</Link>
              <div className="flex items-center gap-2">
                {user?.role === "admin" && (
                  <Link href={"/admin"}>Admin</Link>
                )}
              </div>
            </div>
            {user ? (
              <Link href="/auth/logout">Logout</Link>
            ) : (
              <Link href="/auth/login">Login</Link>
            )}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <main className="flex-1 flex flex-col gap-6 px-4">
            {user ? (
              <div>
                <h2 className="font-medium text-xl mb-4">
                  Welcome, {user.email} ({user.role})
                </h2>
              </div>
            ) : (
              <div>
                <h2 className="font-medium text-xl mb-4">
                  Please log in to access the platform
                </h2>
              </div>
            )}
          </main>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
