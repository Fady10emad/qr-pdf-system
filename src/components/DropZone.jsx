import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Plus } from 'lucide-react';

export const DropZone = ({
  onFilesSelected,
  isUploading,
  uploadingProgress,
  onGenerateDemoPdf,
  onClearProgress,
  t,
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
      e.target.value = '';
    }
  };

  const dt = t.dropzone;

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
              {isUploading ? dt.uploadingTitle : dt.title}
            </h2>
            <p className="dropzone-subtitle">
              {dt.subtitle}
            </p>
          </div>

          <div className="dropzone-badges">
            <span className="badge-tag">
              <FileText size={13} /> {dt.multipleSupported}
            </span>
            <span className="badge-tag highlight-green">
              <CheckCircle2 size={13} /> {dt.permanentLink}
            </span>
            <span className="badge-tag">
              <Sparkles size={13} /> {dt.highResQr}
            </span>
          </div>

          {/* Quick Demo Button */}
          {!isUploading && (
            <div className="demo-helper" onClick={(e) => e.stopPropagation()}>
              <span className="demo-text">{dt.noPdfReady}</span>
              <button
                type="button"
                className="btn-demo"
                onClick={onGenerateDemoPdf}
                title={dt.trySample}
              >
                <Plus size={14} /> {dt.trySample}
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
              {isUploading ? dt.processingUploads : dt.uploadResults}
            </h3>
            {!isUploading && (
              <button
                type="button"
                className="btn-clear-progress"
                onClick={onClearProgress}
              >
                {dt.dismiss}
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
                      <CheckCircle2 size={14} /> {dt.qrGenerated}
                    </span>
                  ) : item.status === 'error' ? (
                    <div className="status-error-block">
                      <div className="status-error-text">
                        <AlertCircle size={15} />
                        <span>{item.errorMessage || dt.uploadFailed}</span>
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
                      <Loader2 size={13} className="spinning" /> {item.statusMessage || dt.uploading}
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
