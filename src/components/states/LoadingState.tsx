interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Carregando a previsão do tempo...',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100 backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-accent-400 border-t-transparent motion-reduce:animate-none"
      />
      <span>{message}</span>
    </div>
  );
}
