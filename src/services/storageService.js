import { createClient } from '@supabase/supabase-js';

const STORAGE_CONFIG_KEY = 'pdf_qr_storage_config_v1';
const UPLOAD_HISTORY_KEY = 'pdf_qr_uploaded_items_v1';

// Default system configuration (built-in permanent defaults)
export const SYSTEM_DEFAULT_CONFIG = {
  supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || 'https://vjsoqcxmmqpefrsweetb.supabase.co',
  supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L9daGOpw8C5BdPE65ksyQw_PO2qqUUM',
  bucketName: import.meta.env?.VITE_SUPABASE_BUCKET || 'pdfs',
  autoConnect: true,
};

export const getStorageConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        supabaseUrl: (parsed.supabaseUrl || SYSTEM_DEFAULT_CONFIG.supabaseUrl).trim(),
        supabaseAnonKey: (parsed.supabaseAnonKey || SYSTEM_DEFAULT_CONFIG.supabaseAnonKey).trim(),
        bucketName: (parsed.bucketName || SYSTEM_DEFAULT_CONFIG.bucketName).trim(),
        autoConnect: true,
      };
    }
  } catch (err) {
    console.warn('Failed to parse storage config:', err);
  }
  return { ...SYSTEM_DEFAULT_CONFIG };
};

export const saveStorageConfig = (config) => {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
};

export const getSupabaseClient = (customConfig = null) => {
  const config = customConfig || getStorageConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }
  try {
    return createClient(config.supabaseUrl.trim(), config.supabaseAnonKey.trim(), {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
};

/**
 * Tests connection to Supabase storage bucket
 */
export const testStorageConnection = async (config) => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return { success: false, message: 'Please provide both Project URL and Anon Public Key.' };
  }

  try {
    const client = createClient(config.supabaseUrl.trim(), config.supabaseAnonKey.trim(), {
      auth: { persistSession: false },
    });
    const bucket = (config.bucketName || 'pdfs').trim();

    // Check if bucket exists or list contents
    const { data, error } = await client.storage.from(bucket).list('', { limit: 1 });
    if (error) {
      return {
        success: false,
        message: `Connected to Supabase, but bucket "${bucket}" error: ${error.message}. Ensure the bucket exists and is set to Public!`,
      };
    }

    return {
      success: true,
      message: `Successfully connected to bucket "${bucket}"! Your QR codes will be permanent and non-expiring.`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Check your URL and Key.'}`,
    };
  }
};

/**
 * Upload single PDF file
 */
export const uploadPdf = async (file, onProgress) => {
  if (!file || file.type !== 'application/pdf') {
    throw new Error(`"${file?.name || 'File'}" is not a valid PDF document.`);
  }

  const config = getStorageConfig();
  const client = getSupabaseClient(config);
  const bucket = (config.bucketName || 'pdfs').trim();

  const id = 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `uploads/${Date.now()}_${safeName}`;

  if (client) {
    if (onProgress) onProgress(20);

    const { data, error } = await client.storage.from(bucket).upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error details:', error);
      if (
        error.message?.toLowerCase().includes('row-level security') ||
        error.message?.toLowerCase().includes('policy') ||
        error.message?.toLowerCase().includes('violates') ||
        error.statusCode === '403' ||
        error.statusCode === 403
      ) {
        throw new Error(
          `Supabase blocked upload (RLS Policy): Anonymous uploads need permission on the '${bucket}' bucket. Run the quick SQL fix in Supabase SQL editor!`
        );
      }
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    if (onProgress) onProgress(80);

    const { data: publicData } = client.storage.from(bucket).getPublicUrl(filePath);
    const finalUrl = publicData.publicUrl;

    if (onProgress) onProgress(100);

    return {
      id,
      name: file.name,
      size: file.size,
      url: finalUrl,
      storagePath: filePath,
      storageType: 'supabase',
      bucket,
      isNonExpirable: true,
      createdAt: new Date().toISOString(),
    };
  } else {
    // Local preview fallback mode (when cloud credentials not yet entered)
    if (onProgress) onProgress(50);
    const blobUrl = URL.createObjectURL(file);
    if (onProgress) onProgress(100);

    return {
      id,
      name: file.name,
      size: file.size,
      url: blobUrl,
      storagePath: 'local',
      storageType: 'local-demo',
      bucket: 'local-memory',
      isNonExpirable: false,
      createdAt: new Date().toISOString(),
      note: 'Local preview QR code. For non-expiring worldwide access, connect your free Supabase storage.',
    };
  }
};

/**
 * History Management in LocalStorage
 */
export const getHistory = () => {
  try {
    const raw = localStorage.getItem(UPLOAD_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load history:', err);
    return [];
  }
};

export const saveItemToHistory = (item) => {
  const list = getHistory();
  const updated = [item, ...list.filter((x) => x.id !== item.id)];
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
  return updated;
};

export const saveMultipleToHistory = (newItems) => {
  const list = getHistory();
  const updated = [...newItems, ...list];
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
  return updated;
};

export const removeItemFromHistory = (id) => {
  const list = getHistory();
  const updated = list.filter((item) => item.id !== id);
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
  return updated;
};

export const clearHistory = () => {
  localStorage.removeItem(UPLOAD_HISTORY_KEY);
  return [];
};

/**
 * Helper to get storage path from an item
 */
export const getStoragePath = (item) => {
  if (item.storagePath && item.storagePath !== 'local') {
    return item.storagePath;
  }
  if (item.url && item.url.includes('/public/')) {
    const parts = item.url.split('/public/');
    if (parts.length > 1) {
      const sub = parts[1]; // e.g. "pdfs/uploads/123_abc.pdf"
      const bucket = getStorageConfig().bucketName || 'pdfs';
      if (sub.startsWith(bucket + '/')) {
        return decodeURIComponent(sub.substring(bucket.length + 1));
      }
      return decodeURIComponent(sub);
    }
  }
  return null;
};

/**
 * Delete single PDF from Supabase cloud storage and local history
 */
export const deletePdf = async (item) => {
  if (!item) return getHistory();

  const config = getStorageConfig();
  const client = getSupabaseClient(config);
  const bucket = (config.bucketName || 'pdfs').trim();
  const path = getStoragePath(item);

  if (client && path) {
    try {
      const { data, error } = await client.storage.from(bucket).remove([path]);
      if (error) {
        console.warn(`Supabase deletion warning for ${path}:`, error.message);
      } else {
        console.log(`Deleted ${path} from Supabase bucket "${bucket}"`);
      }
    } catch (err) {
      console.error(`Error deleting file from Supabase:`, err);
    }
  }

  return removeItemFromHistory(item.id);
};

/**
 * Delete multiple PDFs from Supabase cloud storage and local history
 */
export const deleteMultiplePdfs = async (items) => {
  if (!items || items.length === 0) return getHistory();

  const config = getStorageConfig();
  const client = getSupabaseClient(config);
  const bucket = (config.bucketName || 'pdfs').trim();

  const pathsToDelete = items
    .map(getStoragePath)
    .filter(Boolean);

  if (client && pathsToDelete.length > 0) {
    try {
      const { data, error } = await client.storage.from(bucket).remove(pathsToDelete);
      if (error) {
        console.warn('Supabase bulk deletion warning:', error.message);
      } else {
        console.log(`Deleted ${pathsToDelete.length} files from Supabase bucket "${bucket}"`);
      }
    } catch (err) {
      console.error('Error during bulk deletion from Supabase:', err);
    }
  }

  const idsToRemove = new Set(items.map((x) => x.id));
  const currentList = getHistory();
  const updated = currentList.filter((item) => !idsToRemove.has(item.id));
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
  return updated;
};
