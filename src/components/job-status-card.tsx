"use client";

import { CheckCircle2, XCircle, Loader2, Clock, AlertCircle, Timer } from "lucide-react";

export interface JobStatus {
  id: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  currentStep?: string | null;
  itemsProcessed: number;
  itemsTotal?: number | null;
  currentItem?: string | null;
  timeElapsed: number;
  errors: number;
  errorMessage?: string | null;
  activityLog?: Array<{
    timestamp: string;
    message: string;
    type?: "info" | "success" | "error" | "warning";
  }>;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface JobStatusCardProps {
  job: JobStatus;
  onDismiss?: () => void;
}

export function JobStatusCard({ job, onDismiss }: JobStatusCardProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--foreground-subtle)]" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "failed":
        return "border-red-200 bg-red-50";
      case "running":
        return "border-[var(--accent)]/30 bg-[var(--accent-light)]";
      default:
        return "border-[var(--card-border)] bg-[var(--background-secondary)]";
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-sm text-[var(--foreground)]">{formatType(job.type)}</h3>
            <p className="text-xs text-[var(--foreground-muted)] capitalize">{job.status}</p>
          </div>
        </div>
        {onDismiss && job.status !== "running" && (
          <button
            onClick={onDismiss}
            className="text-[var(--foreground-subtle)] hover:text-[var(--foreground)] text-sm p-1 rounded hover:bg-[var(--background-tertiary)]"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {job.status === "running" && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--foreground-muted)]">
              {job.itemsTotal
                ? `${job.itemsProcessed} / ${job.itemsTotal}`
                : `${job.itemsProcessed} items`}
            </span>
            <span className="text-[var(--foreground-muted)]">{Math.round(job.progress)}%</span>
          </div>
          <div className="w-full bg-[var(--background-tertiary)] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Step */}
      {job.currentStep && (
        <p className="text-sm text-[var(--foreground-muted)] mb-2">{job.currentStep}</p>
      )}

      {/* Current Item */}
      {job.currentItem && job.status === "running" && (
        <p className="text-xs text-[var(--foreground-subtle)] mb-2 truncate">
          Processing: {job.currentItem}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--foreground-subtle)]">
        {job.startedAt && (
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {formatTime(job.timeElapsed)}
          </span>
        )}
        {job.errors > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            {job.errors} errors
          </span>
        )}
      </div>

      {/* Error Message */}
      {job.errorMessage && (
        <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
          {job.errorMessage}
        </div>
      )}

      {/* Activity Log (last 3 entries) */}
      {job.activityLog && job.activityLog.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
          <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">
            Recent Activity:
          </p>
          <div className="space-y-1">
            {job.activityLog.slice(-3).map((entry, idx) => (
              <p
                key={idx}
                className={`text-xs ${
                  entry.type === "error"
                    ? "text-red-600"
                    : entry.type === "success"
                    ? "text-green-600"
                    : "text-[var(--foreground-subtle)]"
                }`}
              >
                {entry.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
