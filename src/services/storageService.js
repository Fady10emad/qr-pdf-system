import { createClient } from '@supabase/supabase-js';

// Built-in Supabase Cloud Configuration (Zero caching, direct cloud access)
export const SYSTEM_DEFAULT_CONFIG = {
  supabaseUrl: import.meta.env?.VITE_SUPABASE_URL || 'https://vjsoqcxmmqpefrsweetb.supabase.co',
  supabaseAnonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L9daGOpw8C5BdPE65ksyQw_PO2qqUUM',
  bucketName: import.meta.env?.VITE_SUPABASE_BUCKET || 'pdfs',
};

export const getSupabaseClient = () => {
  if (!SYSTEM_DEFAULT_CONFIG.supabaseUrl || !SYSTEM_DEFAULT_CONFIG.supabaseAnonKey) {
    return null;
  }
  try {
    return createClient(SYSTEM_DEFAULT_CONFIG.supabaseUrl.trim(), SYSTEM_DEFAULT_CONFIG.supabaseAnonKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    });
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
};

/**
 * Helper to get storage path from an item
 */
export const getStoragePath = (item) => {
  if (!item) return null;
  if (item.storagePath && item.storagePath !== 'local') {
    return item.storagePath;
  }
  if (item.url && item.url.includes('/public/')) {
    const parts = item.url.split('/public/');
    if (parts.length > 1) {
      const sub = parts[1]; // e.g. "pdfs/uploads/123_abc.pdf"
      const bucket = SYSTEM_DEFAULT_CONFIG.bucketName || 'pdfs';
      if (sub.startsWith(bucket + '/')) {
        return decodeURIComponent(sub.substring(bucket.length + 1));
      }
      return decodeURIComponent(sub);
    }
  }
  return null;
};

/**
 * Fetch all PDFs directly from Supabase Cloud (ZERO LOCAL CACHING)
 * Always queries live Supabase database table and storage bucket.
 */
export const fetchPdfs = async () => {
  const client = getSupabaseClient();
  const bucket = (SYSTEM_DEFAULT_CONFIG.bucketName || 'pdfs').trim();

  if (!client) {
    return [];
  }

  // 1. Live query to Supabase PostgreSQL Database Table 'pdf_qr_codes'
  try {
    const { data, error } = await client
      .from('pdf_qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row) => ({
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
    }
  } catch (err) {
    console.warn('Database table fetch notice:', err.message);
  }

  // 2. Direct Storage Bucket Fallback: List files directly from the bucket 'uploads' folder
  try {
    const { data: storageFiles, error: storageErr } = await client.storage
      .from(bucket)
      .list('uploads', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (!storageErr && Array.isArray(storageFiles) && storageFiles.length > 0) {
      return storageFiles
        .filter((file) => file.name && !file.name.startsWith('.'))
        .map((file) => {
          const filePath = `uploads/${file.name}`;
          const { data: publicData } = client.storage.from(bucket).getPublicUrl(filePath);

          // Clean display name (strip timestamp prefix: 1791507785555_name.pdf -> name.pdf)
          const parts = file.name.split('_');
          const displayName = parts.length > 1 ? parts.slice(1).join('_') : file.name;

          return {
            id: 'pdf_' + (file.id || file.name),
            name: displayName,
            size: file.metadata?.size || 0,
            url: publicData.publicUrl,
            storagePath: filePath,
            storageType: 'supabase',
            bucket,
            isNonExpirable: true,
            createdAt: file.created_at || new Date().toISOString(),
          };
        });
    }
  } catch (err) {
    console.warn('Storage list fallback notice:', err.message);
  }

  return [];
};

/**
 * Upload PDF directly to Supabase Cloud Storage & Database
 * (NO LOCAL STORAGE CACHING)
 */
export const uploadPdf = async (file, onProgress) => {
  if (!file || file.type !== 'application/pdf') {
    throw new Error(`"${file?.name || 'File'}" is not a valid PDF document.`);
  }

  const client = getSupabaseClient();
  const bucket = (SYSTEM_DEFAULT_CONFIG.bucketName || 'pdfs').trim();

  const id = 'pdf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `uploads/${Date.now()}_${safeName}`;
  const createdAt = new Date().toISOString();

  if (client) {
    if (onProgress) onProgress(20);

    // 1. Upload to Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '0',
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

    // 3. Insert record directly into Supabase Database table 'pdf_qr_codes'
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
      console.warn('Database insert notice (table might not exist yet):', dbErr.message);
    }

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
      createdAt,
    };
  } else {
    throw new Error('Supabase client is not configured.');
  }
};

/**
 * Delete single PDF directly from Supabase Cloud Database & Storage
 * (NO LOCAL STORAGE CACHING)
 */
export const deletePdf = async (item) => {
  if (!item) return;

  const client = getSupabaseClient();
  const bucket = (SYSTEM_DEFAULT_CONFIG.bucketName || 'pdfs').trim();
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

    // 2. Delete the actual file from Supabase Storage bucket
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
};

/**
 * Delete multiple PDFs directly from Supabase Cloud Database & Storage
 * (NO LOCAL STORAGE CACHING)
 */
export const deleteMultiplePdfs = async (items) => {
  if (!items || items.length === 0) return;

  const client = getSupabaseClient();
  const bucket = (SYSTEM_DEFAULT_CONFIG.bucketName || 'pdfs').trim();

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
};
