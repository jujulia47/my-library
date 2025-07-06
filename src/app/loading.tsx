"use client";

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-amber-50/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out">
      <div className="text-center">
        <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent">
          <span className="sr-only">Carregando...</span>
        </div>
        <p className="mt-4 text-amber-900 font-serif text-lg">Preparando sua aventura...</p>
      </div>
    </div>
  );
}
