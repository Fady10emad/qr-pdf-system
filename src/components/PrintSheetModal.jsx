import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, LayoutGrid, CheckSquare, Square } from 'lucide-react';

export const PrintSheetModal = ({ items, isOpen, onClose }) => {
  const [columns, setColumns] = useState(3);
  const [includeDate, setIncludeDate] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop print-modal-backdrop" onClick={onClose}>
      <div className="print-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="modal-title-group">
            <div className="modal-icon-glow">
              <Printer size={22} className="modal-icon" />
            </div>
            <div>
              <h2 className="modal-title">Printable QR Sticker Sheet</h2>
              <p className="modal-subtitle">
                Print ready labels for stickers, flyers, product tags, or documentation
              </p>
            </div>
          </div>

          <div className="header-actions">
            {/* Column Selector */}
            <div className="column-selector">
              <span className="selector-label">Columns:</span>
              <button
                type="button"
                className={`btn-col ${columns === 2 ? 'active' : ''}`}
                onClick={() => setColumns(2)}
              >
                2
              </button>
              <button
                type="button"
                className={`btn-col ${columns === 3 ? 'active' : ''}`}
                onClick={() => setColumns(3)}
              >
                3
              </button>
              <button
                type="button"
                className={`btn-col ${columns === 4 ? 'active' : ''}`}
                onClick={() => setColumns(4)}
              >
                4
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
            >
              <Printer size={16} /> Print Sheet (A4)
            </button>

            <button type="button" className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="printable-sheet-wrapper">
          <div
            className={`printable-sheet-grid cols-${columns}`}
            id="printable-sheet"
          >
            {items.map((item) => (
              <div key={item.id} className="sticker-label-card">
                <div className="sticker-qr-box">
                  <QRCodeSVG
                    value={item.url}
                    size={columns === 2 ? 140 : columns === 3 ? 120 : 96}
                    fgColor="#000000"
                    bgColor="#ffffff"
                    level="H"
                  />
                </div>
                <div className="sticker-info">
                  <h4 className="sticker-title">{item.name}</h4>
                  <p className="sticker-hint">Scan with camera to view PDF</p>
                  {includeDate && (
                    <span className="sticker-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
