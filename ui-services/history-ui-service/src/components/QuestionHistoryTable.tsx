import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import QuestionCard from "@/components/QuestionCard";
import type { HistoryEntry } from "@/types/HistoryEntry";
import PaginationBar from "./PaginationBar";

const ITEMS_PER_PAGE = 8;

export interface HistoryTableProps {
  items: HistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedId?: string;
  onSelect?: (entry: HistoryEntry) => void;
}

const QuestionHistoryTable: React.FC<HistoryTableProps> = ({
  items,
  isLoading = false,
  error = null,
  onRetry,
  onSelect,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalQuestions = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalQuestions / ITEMS_PER_PAGE)),
    [totalQuestions],
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = useMemo(
    () => items.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [items, startIndex],
  );

  const showEmptyState = !isLoading && !error && totalQuestions === 0;
  const shouldShowList = !isLoading && !error && !showEmptyState;
  const disableNext = currentPage >= totalPages;
  const disablePrevious = currentPage === 1;

  const handleNextPage = () => {
    if (!disableNext) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (!disablePrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col w-full p-6 rounded-lg">
      {shouldShowList && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalQuestions={totalQuestions}
          itemsPerPage={ITEMS_PER_PAGE}
          loading={isLoading}
          onNext={handleNextPage}
          onPrevious={handlePreviousPage}
        />
      )}

      <div className="p-2 flex items-center gap-4 font-bold">
        <div className="w-15 grid justify-center">No.</div>
        <div className="px-10 flex-1 grid grid-cols-4 gap-4">
          <div>Question</div>
          <div>Category</div>
          <div>Difficulty</div>
          <div>Time Limit</div>
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

      {shouldShowList && (
        <div className="flex flex-col items-center gap-4 overflow-y-auto min-h-[60vh]">
          {currentItems.map((item, index) => (
            <QuestionCard
              key={item.id}
              index={startIndex + index}
              item={item}
              onClick={() => onSelect?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionHistoryTable;
