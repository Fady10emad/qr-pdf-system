import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Plus } from 'lucide-react';

export const DropZone = ({
  onFilesSelected,
  isUploading,
  uploadingProgress,
  onGenerateDemoPdf,
  onClearProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      // Reset input value to allow uploading the same file again if needed
      e.target.value = '';
    }
  };

  return (
    <section className="dropzone-section">
      <div
        className={`dropzone-card ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden-file-input"
          onChange={handleInputChange}
          disabled={isUploading}
        />

        <div className="dropzone-content">
          <div className="upload-icon-pulse">
            {isUploading ? (
              <Loader2 className="upload-icon spinning" size={44} />
            ) : (
              <UploadCloud className="upload-icon" size={44} />
            )}
          </div>

          <div className="dropzone-text-group">
            <h2 className="dropzone-title">
              {isUploading ? 'Uploading & Generating QR Codes...' : 'Upload PDF Files for Non-Expiring QR Codes'}
            </h2>
            <p className="dropzone-subtitle">
              Drag & drop one or multiple PDF documents here, or{' '}
              <span className="browse-highlight">browse files from your computer</span>
            </p>
          </div>

          <div className="dropzone-badges">
            <span className="badge-tag">
              <FileText size={13} /> Multiple Files Supported
            </span>
            <span className="badge-tag highlight-green">
              <CheckCircle2 size={13} /> Permanent Direct Link
            </span>
            <span className="badge-tag">
              <Sparkles size={13} /> High-Res Vector QR (Level H)
            </span>
          </div>

          {/* Quick Demo Button */}
          {!isUploading && (
            <div className="demo-helper" onClick={(e) => e.stopPropagation()}>
              <span className="demo-text">Don't have a PDF ready to test?</span>
              <button
                type="button"
                className="btn-demo"
                onClick={onGenerateDemoPdf}
                title="Generates a sample PDF to test the workflow instantly"
              >
                <Plus size={14} /> Try with Sample PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uploading progress status and error list */}
      {uploadingProgress && uploadingProgress.length > 0 && (
        <div className="upload-progress-container">
          <div className="progress-section-header">
            <h3 className="progress-section-title">
              {isUploading ? 'Processing Uploads...' : 'Upload Results'}
            </h3>
            {!isUploading && (
              <button
                type="button"
                className="btn-clear-progress"
                onClick={onClearProgress}
              >
                Dismiss
              </button>
            )}
          </div>

          <div className="progress-items-list">
            {uploadingProgress.map((item, idx) => (
              <div
                key={idx}
                className={`progress-item-card ${item.status === 'error' ? 'card-has-error' : ''}`}
              >
                <div className="progress-item-header">
                  <div className="progress-file-name">
                    <FileText size={16} className="file-icon" />
                    <span>{item.name}</span>
                  </div>
                  <span className="progress-percent">
                    {item.status === 'error' ? 'Error' : `${item.progress}%`}
                  </span>
                </div>
                {item.status !== 'error' && (
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
                <div className="progress-status-note">
                  {item.status === 'done' ? (
                    <span className="status-done">
                      <CheckCircle2 size={14} /> QR Code Generated
                    </span>
                  ) : item.status === 'error' ? (
                    <div className="status-error-block">
                      <div className="status-error-text">
                        <AlertCircle size={15} />
                        <span>{item.errorMessage || 'Upload failed'}</span>
                      </div>
                      {item.errorMessage?.includes('RLS') && (
                        <div className="rls-quick-fix-box">
                          <p className="rls-fix-text">
                            👉 <strong>Quick Fix in Supabase:</strong> Open <strong>SQL Editor</strong> in Supabase, paste this SQL, and click <strong>Run</strong>:
                          </p>
                          <code className="rls-code">
                            CREATE POLICY "Allow public uploads" ON storage.objects FOR ALL USING (bucket_id = 'pdfs') WITH CHECK (bucket_id = 'pdfs');
                          </code>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="status-uploading">
                      <Loader2 size={13} className="spinning" /> {item.statusMessage || 'Uploading...'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
