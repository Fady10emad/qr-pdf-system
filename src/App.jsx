import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { QRStylerBar } from './components/QRStylerBar';
import { QRCard } from './components/QRCard';
import { BatchActionsBar } from './components/BatchActionsBar';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import {
  getHistory,
  saveItemToHistory,
  clearHistory,
  uploadPdf,
  deletePdf,
  deleteMultiplePdfs,
} from './services/storageService';
import { downloadItemsAsZip } from './utils/zipExport';
import { createSamplePdfFile } from './utils/demoPdf';
import { translations } from './utils/translations';
import { QrCode } from 'lucide-react';

export function App() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Language State: 'en' or 'ar'
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('pdf_qr_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const t = translations[language] || translations.en;

  // Set RTL / LTR dynamically on the document root
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    try {
      localStorage.setItem('pdf_qr_lang', language);
    } catch (e) {
      console.warn(e);
    }
  }, [language]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

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
    showCenterLogo: false,
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

    const initialProgress = files.map((file) => ({
      name: file.name,
      progress: 0,
      status: 'pending',
      statusMessage: t.dropzone.uploading,
      errorMessage: null,
    }));
    setUploadingProgress(initialProgress);

    const newlyCreated = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      setUploadingProgress((prev) =>
        prev.map((item, idx) =>
          idx === i
            ? { ...item, status: 'uploading', statusMessage: t.dropzone.uploading }
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

        setUploadingProgress((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'done', progress: 100, statusMessage: t.dropzone.qrGenerated }
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
                  errorMessage: err.message || t.dropzone.uploadFailed,
                }
              : item
          )
        );
      }
    }

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

  // Delete handlers (with cloud delete)
  const handleDeleteItem = async (id) => {
    const target = items.find((x) => x.id === id);
    const updated = await deletePdf(target);
    setItems(updated);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(t.card.confirmDeleteMultiple)) {
      const targets = items.filter((x) => selectedIds.includes(x.id));
      const updated = await deleteMultiplePdfs(targets);
      setItems(updated);
      setSelectedIds([]);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm(t.card.confirmClearAll)) {
      await deleteMultiplePdfs(items);
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
    <div className={`app-layout ${language === 'ar' ? 'rtl-layout' : 'ltr-layout'}`}>
      {/* Top Navigation */}
      <Header
        onOpenPrintSheet={handlePrintSheet}
        onDownloadAllZip={handleDownloadZipAll}
        totalItems={items.length}
        selectedCount={selectedIds.length}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        t={t}
      />

      <main className="main-content">
        {/* Upload Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
          uploadingProgress={uploadingProgress}
          onGenerateDemoPdf={handleGenerateDemoPdf}
          onClearProgress={() => setUploadingProgress([])}
          t={t}
        />

        {/* QR Styler Controls Bar */}
        <QRStylerBar
          styleConfig={styleConfig}
          onChangeStyle={setStyleConfig}
          t={t}
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
              t={t}
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
                  t={t}
                />
              ))}
            </div>
          ) : items.length > 0 && searchQuery ? (
            <div className="empty-search-state">
              <p>{t.empty.noMatch} "{searchQuery}"</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
              >
                {t.empty.clearFilter}
              </button>
            </div>
          ) : (
            <div className="empty-collection-state">
              <div className="empty-illustration">
                <QrCode size={56} className="empty-icon" />
              </div>
              <h3 className="empty-title">{t.empty.title}</h3>
              <p className="empty-subtitle">
                {t.empty.subtitle}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <PDFPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        t={t}
      />

      <PrintSheetModal
        items={printItems}
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        t={t}
      />
    </div>
  );
}

export default App;
