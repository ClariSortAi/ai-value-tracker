"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Play,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Loader2,
} from "lucide-react";
import { PipelineStatusPanel } from "./pipeline-status-panel";

type ActionStatus = "idle" | "running" | "success" | "error";

interface AdminControlsProps {
  onJobsUpdate?: (jobIds: string[]) => void;
}

export function AdminControls({ onJobsUpdate }: AdminControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [runStatus, setRunStatus] = useState<{
    scrape: ActionStatus;
    assess: ActionStatus;
    score: ActionStatus;
    enrich: ActionStatus;
    "cleanup-identify": ActionStatus;
    "cleanup-remove": ActionStatus;
    "cleanup-prune": ActionStatus;
  }>({
    scrape: "idle",
    assess: "idle",
    score: "idle",
    enrich: "idle",
    "cleanup-identify": "idle",
    "cleanup-remove": "idle",
    "cleanup-prune": "idle",
  });
  const [message, setMessage] = useState<string>("");

  const runAction = async (
    action:
      | "scrape"
      | "assess"
      | "score"
      | "enrich"
      | "cleanup-identify"
      | "cleanup-remove"
      | "cleanup-prune"
  ) => {
    setMessage("");
    setRunStatus((prev) => ({ ...prev, [action]: "running" }));

    try {
      const res = await fetch("/api/admin/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRunStatus((prev) => ({ ...prev, [action]: "error" }));
        setMessage(
          `Failed: ${data?.message || data?.error || res.status}`
        );
      } else {
        // Capture jobId if present
        if (data.jobId) {
          const newJobIds = [...activeJobIds, data.jobId];
          setActiveJobIds(newJobIds);
          onJobsUpdate?.(newJobIds);
        }
        // For full-pipeline, capture all child jobIds
        if (data.results) {
          const childJobIds: string[] = [];
          Object.values(data.results).forEach((result: unknown) => {
            const r = result as { jobId?: string };
            if (r.jobId) {
              childJobIds.push(r.jobId);
            }
          });
          if (childJobIds.length > 0) {
            const newJobIds = [...activeJobIds, ...childJobIds];
            setActiveJobIds(newJobIds);
            onJobsUpdate?.(newJobIds);
          }
        }

        setRunStatus((prev) => ({ ...prev, [action]: "success" }));

        // Set success message based on action
        if (action === "cleanup-identify") {
          const total = data?.data?.total ?? data?.data?.products?.length ?? 0;
          setMessage(`Found ${total} low-quality products`);
        } else if (action === "cleanup-remove") {
          const lowQ = data?.data?.removed?.lowQuality ?? 0;
          const stale = data?.data?.removed?.stale ?? 0;
          setMessage(`Removed ${lowQ} low-quality, pruned ${stale} stale`);
        } else if (action === "cleanup-prune") {
          setMessage(`Pruned ${data?.data?.pruned ?? 0} stale products`);
        } else {
          setMessage(`${action} completed successfully`);
        }
      }
    } catch (error) {
      setRunStatus((prev) => ({ ...prev, [action]: "error" }));
      setMessage(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
      case "error":
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  const disableAssess = runStatus.scrape !== "success";
  const disableScore = runStatus.assess !== "success";
  const disableEnrich = runStatus.score !== "success";

  return (
    <div className="w-full">
      {/* Collapsible trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-trigger text-sm font-medium text-[var(--foreground-muted)]"
      >
        <span className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Admin Controls
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="mt-3 space-y-4">
          {/* Pipeline Controls */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              Data Pipeline
            </h4>
            <p className="text-xs text-[var(--foreground-subtle)] mb-3">
              Run in order: Scrape gathers data, Assess filters quality, Score
              ranks, Enrich adds detail.
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => runAction("scrape")}
                disabled={runStatus.scrape === "running"}
                className="btn btn-primary btn-sm"
              >
                {getStatusIcon(runStatus.scrape) || (
                  <Play className="w-3.5 h-3.5" />
                )}
                Scrape
              </button>
              <button
                onClick={() => runAction("assess")}
                disabled={runStatus.assess === "running" || disableAssess}
                className="btn btn-secondary btn-sm"
              >
                {getStatusIcon(runStatus.assess) || (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Assess
              </button>
              <button
                onClick={() => runAction("score")}
                disabled={runStatus.score === "running" || disableScore}
                className="btn btn-secondary btn-sm"
              >
                {getStatusIcon(runStatus.score) || (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Score
              </button>
              <button
                onClick={() => runAction("enrich")}
                disabled={runStatus.enrich === "running" || disableEnrich}
                className="btn btn-secondary btn-sm"
              >
                {getStatusIcon(runStatus.enrich) || (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Enrich
              </button>
            </div>
          </div>

          {/* Data Hygiene Controls */}
          <div className="card p-4">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              Data Hygiene
            </h4>
            <p className="text-xs text-[var(--foreground-subtle)] mb-3">
              Remove games, tutorials, hobby projects, and stale entries.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => runAction("cleanup-identify")}
                disabled={runStatus["cleanup-identify"] === "running"}
                className="btn btn-secondary btn-sm"
              >
                {getStatusIcon(runStatus["cleanup-identify"]) || (
                  <Search className="w-3.5 h-3.5" />
                )}
                Identify
              </button>
              <button
                onClick={() => runAction("cleanup-remove")}
                disabled={runStatus["cleanup-remove"] === "running"}
                className="btn btn-secondary btn-sm"
              >
                {getStatusIcon(runStatus["cleanup-remove"]) || (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Remove
              </button>
              <button
                onClick={() => runAction("cleanup-prune")}
                disabled={runStatus["cleanup-prune"] === "running"}
                className="btn btn-secondary btn-sm"
              >
                {getStatusIcon(runStatus["cleanup-prune"]) || (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Prune
              </button>
            </div>
          </div>

          {/* Status message */}
          {message && (
            <p className="text-xs text-[var(--foreground-muted)] px-1">
              {message}
            </p>
          )}

          {/* Job status panel */}
          {activeJobIds.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Job Progress
              </h4>
              <PipelineStatusPanel
                jobIds={activeJobIds}
                onJobComplete={(jobId) => {
                  setTimeout(() => {
                    setActiveJobIds((prev) =>
                      prev.filter((id) => id !== jobId)
                    );
                  }, 5000);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

