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
      aria-label="Usar localização atual"
      title="Usar localização atual"
      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-800 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-800"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    </button>
  );
}
