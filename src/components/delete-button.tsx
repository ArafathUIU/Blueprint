"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  projectId: string;
  projectName: string;
  redirectTo?: string;
}

export function DeleteButton({ projectId, projectName, redirectTo }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Delete failed" }));
        throw new Error(data.error || `Delete failed (${res.status})`);
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        {error ? (
          <span className="text-[10px] text-red-400" title={error}>Failed</span>
        ) : (
          <>
            <span className="text-[10px] text-zinc-500">Delete?</span>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? "..." : "Yes"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white"
            >
              No
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className="rounded p-1 text-zinc-600 opacity-0 transition-all hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"
      title={`Delete "${projectName}"`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}
