import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { HistoryEntry } from "@/types/HistoryEntry";
import { cn } from "@/lib/utils";

const itemsPerPage = 8;

interface HistoryTableProps {
  items: HistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedId?: string;
  onSelect?: (entry: HistoryEntry) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  isLoading = false,
  error = null,
  onRetry,
  selectedId,
  onSelect,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const showEmptyState = !isLoading && !error && items.length === 0;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex justify-center flex-col w-full p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-end items-center mb-4 text-gray-400 text-sm">
        <span className="mr-auto text-xs uppercase tracking-widest text-slate-500">
          History Records
        </span>
        <span>
          Showing {items.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, items.length)} of {items.length}
        </span>
        <div className="flex items-center">
          <Button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading || showEmptyState}
            variant="link"
            className="text-gray-400 px-2 hover:no-underline"
          >
            Previous
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading || showEmptyState}
            variant="link"
            className="text-gray-400 px-2 hover:no-underline"
          >
            Next
          </Button>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          <span>{error}</span>
          {onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          Loading history…
        </div>
      )}
      {showEmptyState && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          No history snapshots found for this filter.
        </div>
      )}
      {!isLoading && !error && currentItems.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  No.
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Question Attempted
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Topic
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Difficulty
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  Time Limit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
              {currentItems.map((item, index) => {
                const topics =
                  item.topics.length > 0 ? item.topics.join(", ") : "—";
                const timeLimit =
                  typeof item.timeLimit === "number"
                    ? `${item.timeLimit} min`
                    : "—";
                const isSelected = item.id === selectedId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelect?.(item)}
                    className={cn(
                      "hover:bg-slate-800/60 cursor-pointer transition-colors",
                      isSelected && "bg-slate-800/80",
                    )}
                  >
                    <td className="px-4 py-3 align-top text-slate-300">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-semibold text-orange-300">
                          {item.questionTitle || "Untitled Question"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Session {item.sessionId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-300">
                      {topics}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-300">
                      {item.difficulty ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-300">
                      {timeLimit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
