const supabase = require('./supabase');

const BUCKET_NAME = 'tour-images';

const checkedBuckets = new Set();

/**
 * Ensures that the bucket exists and is public.
 * @param {string} bucketName - Name of the bucket to verify/create
 */
async function ensureBucketExists(bucketName) {
  if (checkedBuckets.has(bucketName)) return;
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn(`Không thể kiểm tra danh sách bucket từ Supabase:`, listError.message);
      return;
    }

    const exists = buckets.some(b => b.id === bucketName);
    if (!exists) {
      console.log(`Bucket "${bucketName}" chưa tồn tại. Đang tự động tạo...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      if (createError) {
        console.error(`Không thể tự động tạo bucket "${bucketName}":`, createError.message);
      } else {
        console.log(`Đã tự động tạo thành công public bucket "${bucketName}" trên Supabase.`);
      }
    }
    checkedBuckets.add(bucketName);
  } catch (err) {
    console.error(`Lỗi trong quá trình đảm bảo bucket "${bucketName}" tồn tại:`, err);
  }
}

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} fileName - Unique file name to store
 * @param {string} mimeType - MIME type of the file
 * @param {string} bucketName - Name of the bucket (default 'tour-images')
 * @param {string} folderName - Folder inside the bucket (default 'tours')
 * @returns {string} Public URL of the uploaded file
 */
async function uploadToSupabase(fileBuffer, fileName, mimeType, bucketName = BUCKET_NAME, folderName = 'tours') {
  await ensureBucketExists(bucketName);
  const filePath = `${folderName}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    const uploadError = new Error(`Lỗi khi tải ảnh lên Supabase (${bucketName}): ${error.message}`);
    uploadError.status = 500;
    throw uploadError;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL
 * Automatically parses the bucket name and file path from the URL
 * @param {string} publicUrl - The full public URL of the file
 */
async function deleteFromSupabase(publicUrl) {
  const marker = `/storage/v1/object/public/`;
  const index = publicUrl.indexOf(marker);

  if (index === -1) {
    // Not a Supabase URL, skip
    return;
  }

  // E.g. "tour-images/tours/filename.jpg" or "apartment-images/apartments/filename.jpg"
  const fullPath = publicUrl.substring(index + marker.length);
  const parts = fullPath.split('/');
  
  if (parts.length < 2) {
    return;
  }

  const bucketName = parts[0];
  const filePath = parts.slice(1).join('/');

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error(`Lỗi khi xóa ảnh trên Supabase (bucket: ${bucketName}, path: ${filePath}): ${error.message}`);
  }
}

module.exports = {
  uploadToSupabase,
  deleteFromSupabase,
  BUCKET_NAME,
};
