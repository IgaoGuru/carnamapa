interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Carregando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-carnival-yellow border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
