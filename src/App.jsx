import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Header,
} from './components/Header';
import { DropZone } from './components/DropZone';
import { QRStylerBar } from './components/QRStylerBar';
import { QRCard } from './components/QRCard';
import { BatchActionsBar } from './components/BatchActionsBar';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import {
  getHistory,
  saveItemToHistory,
  removeItemFromHistory,
  clearHistory,
  uploadPdf,
} from './services/storageService';
import { downloadItemsAsZip } from './utils/zipExport';
import { createSamplePdfFile } from './utils/demoPdf';
import { QrCode, FileText, Sparkles, Layers, ShieldCheck, CheckCircle } from 'lucide-react';

export function App() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI Modals
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState([]);

  // QR Style Customization
  const [styleConfig, setStyleConfig] = useState({
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    level: 'H', // High error correction
    showCenterLogo: true,
    exportSize: 1024,
  });

  // Load history on mount
  useEffect(() => {
    const list = getHistory();
    setItems(list);
  }, []);


  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // Ignored if confetti fails
    }
  };

  // Upload handler for single or multiple files
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Initialize progress indicators
    const initialProgress = files.map((file) => ({
      name: file.name,
      progress: 0,
      status: 'pending',
      statusMessage: 'Starting upload...',
      errorMessage: null,
    }));
    setUploadingProgress(initialProgress);

    const newlyCreated = [];

    // Process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Update progress to uploading
      setUploadingProgress((prev) =>
        prev.map((item, idx) =>
          idx === i
            ? { ...item, status: 'uploading', statusMessage: 'Uploading to permanent cloud...' }
            : item
        )
      );

      try {
        const result = await uploadPdf(file, (percent) => {
          setUploadingProgress((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress: percent } : item
            )
          );
        });

        newlyCreated.push(result);
        saveItemToHistory(result);

        // Mark file as done
        setUploadingProgress((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'done', progress: 100, statusMessage: 'Done!' }
              : item
          )
        );
      } catch (err) {
        console.error(`Upload error for ${file.name}:`, err);
        setUploadingProgress((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: err.message || 'Upload failed',
                }
              : item
          )
        );
      }
    }

    // Refresh history
    setItems(getHistory());
    setIsUploading(false);

    if (newlyCreated.length > 0) {
      triggerConfetti();
    }
  };

  // Generate a sample demo PDF for instant testing
  const handleGenerateDemoPdf = () => {
    const demo = createSamplePdfFile('Sample_Report_Doc');
    handleFilesSelected([demo]);
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredItems.map((x) => x.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Delete handlers
  const handleDeleteItem = (id) => {
    const updated = removeItemFromHistory(id);
    setItems(updated);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedIds.length} selected QR code(s)?`)) {
      let updated = items;
      selectedIds.forEach((id) => {
        updated = removeItemFromHistory(id);
      });
      setItems(updated);
      setSelectedIds([]);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all generated QR codes?')) {
      clearHistory();
      setItems([]);
      setSelectedIds([]);
    }
  };

  // Batch Exports
  const handleDownloadZipAll = () => {
    const targets = selectedIds.length > 0
      ? items.filter((x) => selectedIds.includes(x.id))
      : items;
    downloadItemsAsZip(targets, styleConfig, `PDF_QR_Collection_${Date.now()}.zip`);
  };

  const handlePrintSheet = () => {
    setIsPrintSheetOpen(true);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const printItems = selectedIds.length > 0
    ? items.filter((x) => selectedIds.includes(x.id))
    : items;

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Header
        onOpenPrintSheet={handlePrintSheet}
        onDownloadAllZip={handleDownloadZipAll}
        totalItems={items.length}
        selectedCount={selectedIds.length}
      />

      <main className="main-content">

        {/* Upload Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
          uploadingProgress={uploadingProgress}
          onGenerateDemoPdf={handleGenerateDemoPdf}
          onClearProgress={() => setUploadingProgress([])}
        />

        {/* QR Styler Controls Bar */}
        <QRStylerBar
          styleConfig={styleConfig}
          onChangeStyle={setStyleConfig}
        />

        {/* Generated Cards Section */}
        <section className="results-section">
          {items.length > 0 && (
            <BatchActionsBar
              totalCount={filteredItems.length}
              selectedCount={selectedIds.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDeleteSelected={handleDeleteSelected}
              onClearAll={handleClearAll}
              onPrintSelected={handlePrintSheet}
              onDownloadSelectedZip={handleDownloadZipAll}
            />
          )}

          {/* Cards Grid */}
          {filteredItems.length > 0 ? (
            <div className="qr-grid">
              {filteredItems.map((item) => (
                <QRCard
                  key={item.id}
                  item={item}
                  styleConfig={styleConfig}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={handleToggleSelect}
                  onDelete={handleDeleteItem}
                  onPreview={(previewTarget) => setPreviewItem(previewTarget)}
                />
              ))}
            </div>
          ) : items.length > 0 && searchQuery ? (
            <div className="empty-search-state">
              <p>No PDF QR codes match "{searchQuery}"</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search filter
              </button>
            </div>
          ) : (
            <div className="empty-collection-state">
              <div className="empty-illustration">
                <QrCode size={56} className="empty-icon" />
              </div>
              <h3 className="empty-title">No PDF QR Codes Generated Yet</h3>
              <p className="empty-subtitle">
                Drag and drop your PDF files above or click the sample button to generate your first non-expiring QR code.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}

      <PDFPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <PrintSheetModal
        items={printItems}
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
      />
    </div>
  );
}

export default App;
