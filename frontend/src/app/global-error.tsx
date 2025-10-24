'use client'; // Error components must be Client Components

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center bg-gray-100 dark:bg-gray-900">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Something went wrong!
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            An unexpected application error occurred.
          </p>
          <button
            onClick={() => reset()}
            className="mt-8 px-6 py-3 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}