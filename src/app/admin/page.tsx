"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { AdminControls } from "@/components/admin-controls";

export default function AdminPage() {
  const [jobIds, setJobIds] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container-wide py-10">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/" className="breadcrumb__item">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-navy)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[var(--foreground)]">
                Admin Dashboard
              </h1>
              <p className="text-[var(--foreground-muted)]">
                Manage data pipelines and system maintenance
              </p>
            </div>
          </div>
        </header>

        {/* Admin Controls */}
        <div className="max-w-4xl">
          <AdminControls onJobsUpdate={setJobIds} />
        </div>

        {/* Additional Admin Info */}
        <div className="mt-10 max-w-4xl">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              System Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--background-secondary)] rounded-lg">
                <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-1">
                  Environment
                </p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Production
                </p>
              </div>
              <div className="p-4 bg-[var(--background-secondary)] rounded-lg">
                <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-1">
                  Version
                </p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  1.0.0
                </p>
              </div>
              <div className="p-4 bg-[var(--background-secondary)] rounded-lg">
                <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-1">
                  Active Jobs
                </p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {jobIds.length}
                </p>
              </div>
              <div className="p-4 bg-[var(--background-secondary)] rounded-lg">
                <p className="text-xs text-[var(--foreground-subtle)] uppercase tracking-wider mb-1">
                  Status
                </p>
                <p className="text-sm font-medium text-green-600">
                  Operational
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
