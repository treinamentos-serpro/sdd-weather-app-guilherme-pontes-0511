interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section
      role="status"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md sm:p-8"
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-slate-300">{description}</p>
    </section>
  );
}
