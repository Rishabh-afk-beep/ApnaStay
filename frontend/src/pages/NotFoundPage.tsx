import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
        <AlertTriangle className="h-12 w-12 text-slate-400 dark:text-slate-500" />
      </div>
      <h1 className="mt-8 text-4xl font-black text-slate-900 dark:text-slate-50">
        404 - Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-lg text-slate-600 dark:text-slate-400">
        Oops! We couldn't find the page you were looking for. It might have been
        moved or deleted.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full bg-amber-500 px-8 py-3 font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-amber-600"
      >
        Go Back Home
      </Link>
    </div>
  );
}
