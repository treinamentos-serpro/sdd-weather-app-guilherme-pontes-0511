interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-rose-300/30 bg-rose-400/10 p-5 text-slate-100 backdrop-blur-md"
    >
      <h2 className="text-lg font-semibold">Não foi possível carregar o clima</h2>
      <p className="mt-2 text-sm text-slate-200">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-xl border border-white/20 px-4 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
      >
        Tentar novamente
      </button>
    </section>
  );
}
