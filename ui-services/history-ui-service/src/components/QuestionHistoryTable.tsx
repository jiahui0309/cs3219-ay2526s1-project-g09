import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import QuestionCard from "./QuestionCard";
import type { HistoryEntry } from "@/types/HistoryEntry";

const itemsPerPage = 8;

interface HistoryTableProps {
  items: HistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  isLoading = false,
  error = null,
  onRetry,
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
        <div className="flex flex-col items-center gap-4 overflow-y-auto">
          {currentItems.map((item, index) => (
            <QuestionCard
              key={item.id}
              index={startIndex + index}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
