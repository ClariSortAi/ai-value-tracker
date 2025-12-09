"use client";

import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

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
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "failed":
        return "border-red-200 bg-red-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
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
      className={`rounded-lg border-2 p-4 transition-all ${getStatusColor()}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-sm">{formatType(job.type)}</h3>
            <p className="text-xs text-gray-600 capitalize">{job.status}</p>
          </div>
        </div>
        {onDismiss && job.status !== "running" && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ×
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {job.status === "running" && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">
              {job.itemsTotal
                ? `${job.itemsProcessed} / ${job.itemsTotal}`
                : `${job.itemsProcessed} items`}
            </span>
            <span className="text-gray-600">{Math.round(job.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Step */}
      {job.currentStep && (
        <p className="text-sm text-gray-700 mb-2">{job.currentStep}</p>
      )}

      {/* Current Item */}
      {job.currentItem && job.status === "running" && (
        <p className="text-xs text-gray-600 mb-2 italic">
          Processing: {job.currentItem}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        {job.startedAt && (
          <span>⏱️ {formatTime(job.timeElapsed)}</span>
        )}
        {job.errors > 0 && (
          <span className="text-red-600">⚠️ {job.errors} errors</span>
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
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-1">
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
                    : "text-gray-600"
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

