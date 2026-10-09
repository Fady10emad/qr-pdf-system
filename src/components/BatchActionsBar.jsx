import React from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Trash2,
  Printer,
  Download,
} from 'lucide-react';

export const BatchActionsBar = ({
  totalCount,
  selectedCount,
  searchQuery,
  onSearchChange,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onClearAll,
  onPrintSelected,
  onDownloadSelectedZip,
  t,
}) => {
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const bt = t.batch;

  return (
    <div className="batch-bar-container">
      <div className="batch-left">
        {/* Select All Toggle */}
        <button
          type="button"
          className="btn-select-toggle"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          title={allSelected ? bt.deselectAll : bt.selectAll}
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          <span>{allSelected ? bt.deselectAll : bt.selectAll}</span>
        </button>

        <span className="batch-counter">
          {totalCount} {totalCount === 1 ? bt.pdf : bt.pdfs}
          {selectedCount > 0 && (
            <span className="selected-tag">({selectedCount} {bt.selected})</span>
          )}
        </span>
      </div>

      {/* Center Search Input */}
      <div className="batch-search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={bt.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
          >
            &times;
          </button>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="batch-right">
        {selectedCount > 0 && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onPrintSelected}
              title={bt.print}
            >
              <Printer size={14} /> {bt.print} ({selectedCount})
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onDownloadSelectedZip}
              title={bt.zip}
            >
              <Download size={14} /> {bt.zip} ({selectedCount})
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onDeleteSelected}
              title={bt.delete}
            >
              <Trash2 size={14} /> {bt.delete}
            </button>
          </>
        )}

        {totalCount > 0 && selectedCount === 0 && (
          <button
            type="button"
            className="btn-ghost-danger"
            onClick={onClearAll}
            title={bt.clearHistory}
          >
            {bt.clearHistory}
          </button>
        )}
      </div>
    </div>
  );
};
