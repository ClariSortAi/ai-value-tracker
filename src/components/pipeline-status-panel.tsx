"use client";

import { useEffect, useState, useCallback } from "react";
import { JobStatusCard, type JobStatus } from "./job-status-card";
import { Loader2 } from "lucide-react";

interface PipelineStatusPanelProps {
  jobIds: string[];
  onJobComplete?: (jobId: string) => void;
}

export function PipelineStatusPanel({
  jobIds,
  onJobComplete,
}: PipelineStatusPanelProps) {
  const [jobs, setJobs] = useState<Record<string, JobStatus>>({});
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const job: JobStatus = await res.json();
        return job;
      }
    } catch (error) {
      console.error(`Error fetching job ${jobId}:`, error);
    }
    return null;
  }, []);

  const updateJobs = useCallback(async () => {
    if (jobIds.length === 0) {
      setLoading(false);
      return;
    }

    const jobPromises = jobIds.map((id) => fetchJobStatus(id));
    const jobResults = await Promise.all(jobPromises);

    const jobsMap: Record<string, JobStatus> = {};
    let hasRunning = false;

    jobResults.forEach((job, idx) => {
      if (job) {
        jobsMap[jobIds[idx]] = job;
        if (job.status === "running" || job.status === "pending") {
          hasRunning = true;
        }

        // Call onJobComplete for newly completed jobs
        if (
          (job.status === "completed" || job.status === "failed") &&
          jobs[jobIds[idx]]?.status === "running"
        ) {
          onJobComplete?.(jobIds[idx]);
        }
      }
    });

    setJobs(jobsMap);
    setLoading(false);
    setPolling(hasRunning);
  }, [jobIds, fetchJobStatus, onJobComplete, jobs]);

  useEffect(() => {
    updateJobs();
  }, [updateJobs]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      updateJobs();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [polling, updateJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (jobIds.length === 0) {
    return null;
  }

  const activeJobs = jobIds
    .map((id) => jobs[id])
    .filter((job) => job && (job.status === "running" || job.status === "pending"));

  const completedJobs = jobIds
    .map((id) => jobs[id])
    .filter((job) => job && (job.status === "completed" || job.status === "failed"));

  return (
    <div className="space-y-4">
      {activeJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Active Jobs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeJobs.map((job) => (
              <JobStatusCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Recent Jobs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedJobs.slice(0, 6).map((job) => (
              <JobStatusCard
                key={job.id}
                job={job}
                onDismiss={() => {
                  // Remove from jobIds (would need parent to manage this)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

