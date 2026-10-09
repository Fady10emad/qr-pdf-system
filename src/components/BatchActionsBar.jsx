import React from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Trash2,
  Printer,
  Download,
  Filter,
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
}) => {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className="batch-bar-container">
      <div className="batch-left">
        {/* Select All Toggle */}
        <button
          type="button"
          className="btn-select-toggle"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          title={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
        </button>

        <span className="batch-counter">
          {totalCount} {totalCount === 1 ? 'PDF' : 'PDFs'}
          {selectedCount > 0 && (
            <span className="selected-tag">({selectedCount} selected)</span>
          )}
        </span>
      </div>

      {/* Center Search Input */}
      <div className="batch-search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Filter PDFs by filename..."
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
              title="Print stickers for selected items"
            >
              <Printer size={14} /> Print ({selectedCount})
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onDownloadSelectedZip}
              title="Download selected QR codes as ZIP"
            >
              <Download size={14} /> ZIP ({selectedCount})
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onDeleteSelected}
              title="Delete selected items"
            >
              <Trash2 size={14} /> Delete
            </button>
          </>
        )}

        {totalCount > 0 && selectedCount === 0 && (
          <button
            type="button"
            className="btn-ghost-danger"
            onClick={onClearAll}
            title="Clear all generated QR codes"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
};
