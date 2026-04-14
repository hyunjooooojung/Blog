import { AUTHOR_NAME, SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-3xl px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {AUTHOR_NAME} · {SITE_NAME}
      </div>
    </footer>
  );
}
