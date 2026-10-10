import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { QRStylerBar } from './components/QRStylerBar';
import { QRCard } from './components/QRCard';
import { BatchActionsBar } from './components/BatchActionsBar';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { DeleteWarningModal } from './components/DeleteWarningModal';
import {
  getHistory,
  fetchPdfs,
  clearHistory,
  uploadPdf,
  deletePdf,
  deleteMultiplePdfs,
} from './services/storageService';
import { downloadItemsAsZip } from './utils/zipExport';
import { createSamplePdfFile } from './utils/demoPdf';
import { translations } from './utils/translations';
import { QrCode, Loader2 } from 'lucide-react';

export function App() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);

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

  // Delete Warning Modal State
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    item: null,
    isBatch: false,
    isClearAll: false,
  });

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

  // Fetch from Supabase Cloud on mount (synchronized across all devices!)
  useEffect(() => {
    let isMounted = true;
    
    // 1. Show cached items immediately for zero latency
    const cached = getHistory();
    if (cached && cached.length > 0) {
      setItems(cached);
    }

    // 2. Fetch live database & storage records from Supabase
    fetchPdfs()
      .then((cloudItems) => {
        if (isMounted && cloudItems) {
          setItems(cloudItems);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch cloud PDFs:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCloud(false);
        }
      });

    return () => {
      isMounted = false;
    };
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

    // Refresh state with new items
    if (newlyCreated.length > 0) {
      setItems((prev) => [...newlyCreated, ...prev]);
      triggerConfetti();
    }

    setIsUploading(false);
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

  // Delete Prompt Handlers (triggers Warning Modal)
  const handlePromptDeleteSingle = (id) => {
    const target = items.find((x) => x.id === id);
    if (target) {
      setDeleteModalState({
        isOpen: true,
        item: target,
        isBatch: false,
        isClearAll: false,
      });
    }
  };

  const handlePromptDeleteSelected = () => {
    setDeleteModalState({
      isOpen: true,
      item: null,
      isBatch: true,
      isClearAll: false,
    });
  };

  const handlePromptClearAll = () => {
    setDeleteModalState({
      isOpen: true,
      item: null,
      isBatch: false,
      isClearAll: true,
    });
  };

  // Confirmed Delete Execution (removes from Supabase database & storage!)
  const handleConfirmDelete = async () => {
    if (deleteModalState.isClearAll) {
      await deleteMultiplePdfs(items);
      clearHistory();
      setItems([]);
      setSelectedIds([]);
    } else if (deleteModalState.isBatch) {
      const targets = items.filter((x) => selectedIds.includes(x.id));
      const updated = await deleteMultiplePdfs(targets);
      setItems(updated);
      setSelectedIds([]);
    } else if (deleteModalState.item) {
      const updated = await deletePdf(deleteModalState.item);
      setItems(updated);
      setSelectedIds((prev) => prev.filter((x) => x !== deleteModalState.item.id));
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
              onDeleteSelected={handlePromptDeleteSelected}
              onClearAll={handlePromptClearAll}
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
                  onDelete={handlePromptDeleteSingle}
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
                {isLoadingCloud ? (
                  <Loader2 size={56} className="empty-icon spinning" />
                ) : (
                  <QrCode size={56} className="empty-icon" />
                )}
              </div>
              <h3 className="empty-title">
                {isLoadingCloud ? 'Syncing with Supabase...' : t.empty.title}
              </h3>
              <p className="empty-subtitle">
                {isLoadingCloud
                  ? 'Loading your cloud stored PDFs from Supabase database...'
                  : t.empty.subtitle}
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

      {/* Delete Warning Modal with Permanent Removal Notice */}
      <DeleteWarningModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({
            isOpen: false,
            item: null,
            isBatch: false,
            isClearAll: false,
          })
        }
        onConfirm={handleConfirmDelete}
        targetItem={deleteModalState.item}
        selectedCount={selectedIds.length}
        isBatch={deleteModalState.isBatch}
        isClearAll={deleteModalState.isClearAll}
        t={t}
      />
    </div>
  );
}

export default App;
