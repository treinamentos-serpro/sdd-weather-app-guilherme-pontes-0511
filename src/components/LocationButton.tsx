interface LocationButtonProps {
  onLocate: () => void;
  pending: boolean;
}

export default function LocationButton({ onLocate, pending }: LocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onLocate}
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 font-semibold text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/5"
    >
      Usar localização atual
    </button>
  );
}
