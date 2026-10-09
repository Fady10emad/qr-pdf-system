import React from 'react';
import { QrCode, Cloud, Printer, Download, Globe } from 'lucide-react';

export const Header = ({
  onOpenPrintSheet,
  onDownloadAllZip,
  totalItems,
  selectedCount,
  language,
  onToggleLanguage,
  t,
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
              <h1 className="brand-title">{t.brand.title}</h1>
              <span className="version-badge">v1.0</span>
            </div>
            <p className="brand-tagline">{t.brand.tagline}</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Permanent Cloud Active Indicator */}
          <div
            className="status-pill connected"
            title={t.brand.cloudActive}
          >
            <span className="pulse-dot green"></span>
            <Cloud size={16} />
            <span className="status-label">{t.brand.cloudActive}</span>
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            className="btn btn-secondary btn-lang-toggle"
            onClick={onToggleLanguage}
            title={language === 'en' ? 'التبديل إلى اللغة العربية' : 'Switch to English'}
          >
            <Globe size={16} className="lang-icon" />
            <span className="lang-label">{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Batch Print Button */}
          {totalItems > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenPrintSheet}
              title={t.brand.printLabels}
            >
              <Printer size={18} />
              <span className="btn-text">{t.brand.printLabels}</span>
              {selectedCount > 0 && <span className="action-counter">{selectedCount}</span>}
            </button>
          )}

          {/* Batch Download ZIP Button */}
          {totalItems > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDownloadAllZip}
              title={t.brand.downloadAllZip}
            >
              <Download size={18} />
              <span className="btn-text">{t.brand.downloadAllZip}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
