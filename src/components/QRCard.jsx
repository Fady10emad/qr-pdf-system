import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import QRCode from 'qrcode';
import {
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  Trash2,
  Calendar,
  HardDrive,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const QRCard = ({
  item,
  styleConfig,
  isSelected,
  onToggleSelect,
  onDelete,
  onPreview,
  t,
}) => {
  const ct = t.card;
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedSize = (item.size / 1024).toFixed(1) + ' KB';
  const isMb = item.size > 1024 * 1024;
  const displaySize = isMb
    ? (item.size / (1024 * 1024)).toFixed(2) + ' MB'
    : formattedSize;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // High-Resolution PNG Download
  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    const targetSize = styleConfig.exportSize || 1024;
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    QRCode.toCanvas(
      canvas,
      item.url,
      {
        width: targetSize,
        margin: 3,
        color: {
          dark: styleConfig.fgColor || '#000000',
          light: styleConfig.bgColor || '#ffffff',
        },
        errorCorrectionLevel: styleConfig.level || 'H',
      },
      (error) => {
        if (error) {
          console.error('PNG generate error:', error);
          return;
        }
        // If showCenterLogo, draw a clean PDF pill in the center
        if (styleConfig.showCenterLogo) {
          const centerSize = targetSize * 0.22;
          const centerPos = (targetSize - centerSize) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(centerPos, centerPos, centerSize, centerSize, centerSize * 0.2);
          ctx.fill();
          ctx.lineWidth = targetSize * 0.01;
          ctx.strokeStyle = styleConfig.fgColor || '#000000';
          ctx.stroke();

          // Draw "PDF" text
          ctx.fillStyle = '#dc2626';
          ctx.font = `bold ${centerSize * 0.38}px "Plus Jakarta Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PDF', targetSize / 2, targetSize / 2);
        }

        const link = document.createElement('a');
        const cleanName = item.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `${cleanName}_QR.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    );
  };

  // Lossless SVG Download
  const handleDownloadSvg = () => {
    const svgElement = document.getElementById(`qr-svg-${item.id}`);
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add namespaces if missing
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, source], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    const cleanName = item.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadLink.href = svgUrl;
    downloadLink.download = `${cleanName}_QR.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className={`qr-card ${isSelected ? 'selected' : ''}`}>
      {/* Top Header Row */}
      <div className="card-top">
        <label className="checkbox-container" title="Select for bulk actions or printing">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
          />
          <span className="custom-checkbox"></span>
        </label>

        <div className="card-file-info">
          <h3 className="card-filename" title={item.name}>
            {item.name}
          </h3>
          <div className="card-meta-row">
            <span className="card-meta-item">
              <HardDrive size={12} /> {displaySize}
            </span>
            <span className="card-meta-item">
              <Calendar size={12} /> {formattedDate}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-card-delete"
          onClick={() => onDelete(item.id)}
          title={ct.deleteTitle}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Permanence Badge */}
      <div className="card-badge-row">
        {item.isNonExpirable ? (
          <span className="non-expiring-badge" title={ct.nonExpiring}>
            <CheckCircle size={13} /> {ct.nonExpiring}
          </span>
        ) : (
          <span className="demo-preview-badge" title={ct.localPreview}>
            <AlertTriangle size={13} /> {ct.localPreview}
          </span>
        )}
      </div>

      {/* QR Code Presentation Box */}
      <div className="qr-box-wrapper">
        <div className="qr-presentation-box" style={{ backgroundColor: styleConfig.bgColor || '#ffffff' }}>
          <QRCodeSVG
            id={`qr-svg-${item.id}`}
            value={item.url}
            size={180}
            fgColor={styleConfig.fgColor || '#0f172a'}
            bgColor={styleConfig.bgColor || '#ffffff'}
            level={styleConfig.level || 'H'}
            imageSettings={
              styleConfig.showCenterLogo
                ? {
                    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%23dc2626"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">PDF</text></svg>',
                    x: undefined,
                    y: undefined,
                    height: 38,
                    width: 38,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>
        <p className="qr-scan-hint">{ct.scanHint}</p>
      </div>

      {/* URL Link Box with Quick Copy */}
      <div className="card-link-box">
        <input
          type="text"
          readOnly
          value={item.url}
          className="link-input"
          title={item.url}
          onClick={(e) => e.target.select()}
        />
        <button
          type="button"
          className={`btn-link-action ${copied ? 'copied' : ''}`}
          onClick={handleCopyLink}
          title={ct.copy}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? ct.copied : ct.copy}</span>
        </button>
      </div>

      {/* Action Footer Buttons */}
      <div className="card-footer-actions">
        <button
          type="button"
          className="btn-action-outline"
          onClick={() => onPreview(item)}
          title={ct.preview}
        >
          <Eye size={14} /> {ct.preview}
        </button>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-action-outline"
          title={ct.open}
        >
          <ExternalLink size={14} /> {ct.open}
        </a>

        <div className="dropdown-download-group">
          <button
            type="button"
            className="btn-action-primary"
            onClick={handleDownloadPng}
            title={ct.pngHd}
          >
            <Download size={14} /> {ct.pngHd}
          </button>
          <button
            type="button"
            className="btn-action-ghost"
            onClick={handleDownloadSvg}
            title={ct.svg}
          >
            {ct.svg}
          </button>
        </div>
      </div>
    </div>
  );
};
