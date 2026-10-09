import React from 'react';
import { QrCode, Cloud, Printer, Download } from 'lucide-react';

export const Header = ({
  onOpenPrintSheet,
  onDownloadAllZip,
  totalItems,
  selectedCount,
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo-glow">
            <div className="brand-icon-wrapper">
              <QrCode className="brand-icon" size={28} />
            </div>
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">PDF QR Studio</h1>
              <span className="version-badge">v1.0</span>
            </div>
            <p className="brand-tagline">Permanent & Non-Expiring PDF QR Generator</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Permanent Cloud Active Indicator */}
          <div
            className="status-pill connected"
            title="Connected to Supabase Cloud Storage. All QR codes are permanent and non-expiring."
          >
            <span className="pulse-dot green"></span>
            <Cloud size={16} />
            <span className="status-label">Permanent Cloud Active</span>
          </div>

          {/* Batch Print Button */}
          {totalItems > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenPrintSheet}
              title="Print QR sticker sheet (A4 label sheet)"
            >
              <Printer size={18} />
              <span className="btn-text">Print Labels</span>
              {selectedCount > 0 && <span className="action-counter">{selectedCount}</span>}
            </button>
          )}

          {/* Batch Download ZIP Button */}
          {totalItems > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDownloadAllZip}
              title="Download all QR codes as a ZIP package"
            >
              <Download size={18} />
              <span className="btn-text">Download All (ZIP)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
