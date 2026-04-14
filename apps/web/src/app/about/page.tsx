import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "개발자 소개 페이지입니다.",
};

const techStack = [
  { name: "Python", icon: "🐍" },
  { name: "FastAPI", icon: "⚡" },
  { name: "AWS", icon: "☁️" },
  { name: "Docker", icon: "🐳" },
  { name: "Git", icon: "🔀" },
  { name: "GitHub", icon: "🐙" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-10">ME</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-3">
          {techStack.map((tech) => (
            <span
              key={tech.name}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary text-secondary-foreground text-sm font-medium"
            >
              <span>{tech.icon}</span>
              <span>{tech.name}</span>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Links</h2>
        <a
          href="https://github.com/hyunjooooojung"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-current"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          github.com/hyunjooooojung
        </a>
      </section>
    </div>
  );
}