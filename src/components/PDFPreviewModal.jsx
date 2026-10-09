import React from 'react';
import { X, Download, ExternalLink, FileText, HardDrive } from 'lucide-react';

export const PDFPreviewModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="pdf-preview-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-glow">
              <FileText size={22} className="modal-icon" />
            </div>
            <div>
              <h2 className="modal-title">{item.name}</h2>
              <p className="modal-subtitle">
                {item.size ? (item.size / 1024).toFixed(1) + ' KB' : 'PDF Document'} &bull; Non-Expiring Link
              </p>
            </div>
          </div>
          <div className="header-actions">
            <a
              href={item.url}
              download={item.name}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="Download PDF"
            >
              <Download size={15} /> Download
            </a>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              title="Open full page"
            >
              <ExternalLink size={15} /> Open Link
            </a>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="pdf-viewer-container">
          <iframe
            src={item.url}
            title={item.name}
            className="pdf-iframe"
            onError={(e) => console.log('iframe load error:', e)}
          />
        </div>
      </div>
    </div>
  );
};
