import { AlertCircle, X, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry, onDismiss }) {
  if (!message) return null;

  return (
    <div className="animate-fade-in flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-300">{message}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
