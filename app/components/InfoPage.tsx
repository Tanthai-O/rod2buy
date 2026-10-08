// Shared layout for static text pages (about / terms / safety / privacy)
export default function InfoPage({
  title,
  subtitle,
  sections,
}: {
  title: string
  subtitle?: string
  sections: { title: string; body: React.ReactNode }[]
}) {
  return (
    <main className="min-h-screen bg-zinc-50">
      <article className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.title} className="bg-white rounded-2xl border border-zinc-100 p-5">
              <h2 className="font-semibold text-zinc-900 mb-2">{s.title}</h2>
              <div className="text-sm text-zinc-700 leading-relaxed">{s.body}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
