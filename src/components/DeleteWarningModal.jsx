import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, HardDrive, Database } from 'lucide-react';

export const DeleteWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  targetItem,
  selectedCount,
  isBatch,
  isClearAll,
  t,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const wt = t.warningModal;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop delete-warning-backdrop" onClick={!isDeleting ? onClose : undefined}>
      <div className="modal-card delete-warning-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header warning-header">
          <div className="modal-title-group">
            <div className="modal-icon-glow warning-icon-glow">
              <AlertTriangle size={24} className="warning-icon-accent" />
            </div>
            <div>
              <h2 className="modal-title warning-title">
                {isClearAll
                  ? wt.clearAllTitle
                  : isBatch
                  ? wt.batchTitle
                  : wt.title}
              </h2>
              <p className="modal-subtitle">{wt.subtitle}</p>
            </div>
          </div>
          {!isDeleting && (
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body warning-body">
          {/* Target File Info Box */}
          <div className="warning-target-box">
            {isClearAll ? (
              <div className="target-summary-row">
                <Database size={18} className="target-icon" />
                <span>{wt.allFilesTarget}</span>
              </div>
            ) : isBatch ? (
              <div className="target-summary-row">
                <Database size={18} className="target-icon" />
                <span>
                  <strong>{selectedCount}</strong> {wt.selectedFilesTarget}
                </span>
              </div>
            ) : (
              <div className="target-summary-row">
                <HardDrive size={18} className="target-icon" />
                <span className="target-filename" title={targetItem?.name}>
                  {targetItem?.name}
                </span>
              </div>
            )}
          </div>

          {/* Critical Warning Callout */}
          <div className="critical-warning-box">
            <AlertTriangle size={20} className="critical-alert-icon" />
            <div className="critical-alert-text">
              <strong>{wt.irreversibleWarning}</strong>
              <p>{wt.consequences}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer warning-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            {wt.cancel}
          </button>
          <button
            type="button"
            className="btn btn-danger-solid"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spinning" />
                <span>{wt.deleting}</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{wt.confirmDelete}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
