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
 * Fetch all PDFs from Supabase Cloud Database & Storage
 * Ensures PDFs are synchronized across ALL devices and browsers!
 */
export const fetchPdfs = async () => {
  const config = getStorageConfig();
  const client = getSupabaseClient(config);
  const bucket = (config.bucketName || 'pdfs').trim();

  if (!client) {
    return getHistory();
  }

  // 1. Try to fetch from Supabase Postgres Database Table 'pdf_qr_codes'
  try {
    const { data, error } = await client
      .from('pdf_qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const items = data.map((row) => ({
        id: row.id,
        name: row.name,
        size: row.size ? Number(row.size) : 0,
        url: row.url,
        storagePath: row.storage_path,
        storageType: 'supabase',
        bucket,
        isNonExpirable: true,
        createdAt: row.created_at || new Date().toISOString(),
      }));

      // Cache locally
      localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(items));
      return items;
    }
  } catch (err) {
    console.warn('Database table fetch warning:', err.message);
  }

  // 2. Storage Bucket Fallback: List files directly from bucket 'uploads' folder!
  // This ensures files are accessible on ANY device even before the database table is created!
  try {
    const { data: storageFiles, error: storageErr } = await client.storage
      .from(bucket)
      .list('uploads', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (!storageErr && Array.isArray(storageFiles) && storageFiles.length > 0) {
      const cached = getHistory();
      const cachedMap = new Map(cached.map((c) => [c.storagePath, c]));

      const items = storageFiles
        .filter((file) => file.name && !file.name.startsWith('.'))
        .map((file) => {
          const filePath = `uploads/${file.name}`;
          const { data: publicData } = client.storage.from(bucket).getPublicUrl(filePath);

          const existing = cachedMap.get(filePath);
          let displayName = existing?.name;
          if (!displayName) {
            // Strip timestamp: 1791507785555_name.pdf -> name.pdf
            const parts = file.name.split('_');
            displayName = parts.length > 1 ? parts.slice(1).join('_') : file.name;
          }

          return {
            id: existing?.id || 'pdf_' + (file.id || file.name),
            name: displayName,
            size: file.metadata?.size || existing?.size || 0,
            url: publicData.publicUrl,
            storagePath: filePath,
            storageType: 'supabase',
            bucket,
            isNonExpirable: true,
            createdAt: file.created_at || existing?.createdAt || new Date().toISOString(),
          };
        });

      if (items.length > 0) {
        localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(items));
        return items;
      }
    }
  } catch (err) {
    console.warn('Storage list fallback warning:', err.message);
  }

  // 3. Fallback to localStorage cache
  return getHistory();
};

/**
 * Upload single PDF file to Supabase Cloud Storage & Database
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
  const createdAt = new Date().toISOString();

  if (client) {
    if (onProgress) onProgress(20);

    // 1. Upload the physical PDF file to Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error details:', uploadError);
      if (
        uploadError.message?.toLowerCase().includes('row-level security') ||
        uploadError.message?.toLowerCase().includes('policy') ||
        uploadError.message?.toLowerCase().includes('violates') ||
        uploadError.statusCode === '403' ||
        uploadError.statusCode === 403
      ) {
        throw new Error(
          `Supabase blocked upload (RLS Policy): Anonymous uploads need permission on the '${bucket}' bucket. Run the quick SQL fix in Supabase SQL editor!`
        );
      }
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    if (onProgress) onProgress(75);

    // 2. Get permanent CDN URL
    const { data: publicData } = client.storage.from(bucket).getPublicUrl(filePath);
    const finalUrl = publicData.publicUrl;

    // 3. Insert record into Supabase Database table 'pdf_qr_codes'
    try {
      await client.from('pdf_qr_codes').insert([
        {
          id,
          name: file.name,
          size: file.size,
          url: finalUrl,
          storage_path: filePath,
          created_at: createdAt,
        },
      ]);
    } catch (dbErr) {
      console.warn('Could not insert record into database table (table may need creation):', dbErr);
    }

    if (onProgress) onProgress(100);

    const item = {
      id,
      name: file.name,
      size: file.size,
      url: finalUrl,
      storagePath: filePath,
      storageType: 'supabase',
      bucket,
      isNonExpirable: true,
      createdAt,
    };

    saveItemToHistory(item);
    return item;
  } else {
    // Local preview fallback mode
    if (onProgress) onProgress(50);
    const blobUrl = URL.createObjectURL(file);
    if (onProgress) onProgress(100);

    const item = {
      id,
      name: file.name,
      size: file.size,
      url: blobUrl,
      storagePath: 'local',
      storageType: 'local-demo',
      bucket: 'local-memory',
      isNonExpirable: false,
      createdAt,
      note: 'Local preview QR code. For non-expiring worldwide access, connect your free Supabase storage.',
    };

    saveItemToHistory(item);
    return item;
  }
};

/**
 * LocalStorage Cache Helpers
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
 * Delete single PDF from Supabase cloud database & storage
 */
export const deletePdf = async (item) => {
  if (!item) return getHistory();

  const config = getStorageConfig();
  const client = getSupabaseClient(config);
  const bucket = (config.bucketName || 'pdfs').trim();
  const path = getStoragePath(item);

  if (client) {
    // 1. Delete record from Supabase database table 'pdf_qr_codes'
    try {
      await client
        .from('pdf_qr_codes')
        .delete()
        .or(`id.eq.${item.id},storage_path.eq.${path}`);
      console.log(`Deleted record from database table: ${item.id}`);
    } catch (dbErr) {
      console.warn('Database table delete notice:', dbErr.message);
    }

    // 2. Delete the actual PDF file from Supabase Storage bucket
    if (path) {
      try {
        const { data, error } = await client.storage.from(bucket).remove([path]);
        if (error) {
          console.warn(`Supabase storage deletion warning for ${path}:`, error.message);
        } else {
          console.log(`Deleted file ${path} from Supabase storage bucket "${bucket}"`);
        }
      } catch (err) {
        console.error(`Error deleting file from Supabase storage:`, err);
      }
    }
  }

  return removeItemFromHistory(item.id);
};

/**
 * Delete multiple PDFs from Supabase cloud database & storage
 */
export const deleteMultiplePdfs = async (items) => {
  if (!items || items.length === 0) return getHistory();

  const config = getStorageConfig();
  const client = getSupabaseClient(config);
  const bucket = (config.bucketName || 'pdfs').trim();

  const pathsToDelete = items.map(getStoragePath).filter(Boolean);
  const idsToDelete = items.map((x) => x.id);

  if (client) {
    // 1. Delete rows from Supabase database table
    try {
      await client
        .from('pdf_qr_codes')
        .delete()
        .in('id', idsToDelete);
      console.log(`Deleted ${idsToDelete.length} records from Supabase database`);
    } catch (dbErr) {
      console.warn('Database bulk delete notice:', dbErr.message);
    }

    // 2. Delete files from Supabase storage bucket
    if (pathsToDelete.length > 0) {
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
  }

  const idsToRemove = new Set(idsToDelete);
  const currentList = getHistory();
  const updated = currentList.filter((item) => !idsToRemove.has(item.id));
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(updated));
  return updated;
};
