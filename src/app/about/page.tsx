import { CATEGORIES } from "@/lib/utils";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-[var(--foreground)] mb-4">About AIValue</h1>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
            We help you discover AI tools that can transform how you work. 
            Our scoring system provides transparent, evidence-based evaluations.
          </p>
        </header>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
            Our Mission
          </h2>
          <p className="text-[var(--foreground-muted)] leading-relaxed max-w-2xl">
            The AI landscape changes daily. New tools launch, existing ones evolve, 
            and it&apos;s hard to keep up. AIValue curates and evaluates AI products 
            so you can discover what&apos;s new and understand at a glance whether 
            it&apos;s worth your time.
          </p>
        </section>

        {/* How We Score */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            How We Score
          </h2>
          <p className="text-[var(--foreground-muted)] mb-8 max-w-2xl">
            Each tool is evaluated across 6 dimensions, weighted to reflect 
            what matters most when adopting new software.
          </p>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <div key={key} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-[var(--foreground)]">
                    {category.label}
                  </h3>
                  <span className="text-sm text-[var(--foreground-subtle)]">
                    {category.weight}%
                  </span>
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Score Guide */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            Score Guide
          </h2>
          <div className="space-y-3 max-w-md">
            <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
              <span className="text-[var(--foreground)]">80-100</span>
              <span className="text-[var(--foreground-muted)]">Excellent — Best in class</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
              <span className="text-[var(--foreground)]">60-79</span>
              <span className="text-[var(--foreground-muted)]">Good — Solid choice</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--card-border)]">
              <span className="text-[var(--foreground)]">40-59</span>
              <span className="text-[var(--foreground-muted)]">Average — Has limitations</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--foreground)]">0-39</span>
              <span className="text-[var(--foreground-muted)]">Below Average — Use with caution</span>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="card p-6 max-w-2xl">
          <h3 className="font-medium text-[var(--foreground)] mb-2">
            Disclaimer
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Scores are generated algorithmically based on publicly available information 
            and are updated periodically. They represent our assessment and should be 
            considered alongside your own evaluation for your specific use case.
          </p>
        </section>
      </div>
    </div>
  );
}
