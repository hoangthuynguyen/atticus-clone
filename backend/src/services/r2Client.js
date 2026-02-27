const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============================================================================
// Cloudflare R2 Client (S3-compatible, zero egress fees)
// =============================================================================

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'bookify-exports';
const SIGNED_URL_EXPIRY = parseInt(process.env.SIGNED_URL_EXPIRY_HOURS || '24') * 3600;

/**
 * Upload an export file to R2 and return a signed download URL
 * @param {Buffer} buffer - File content
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type
 * @param {string} userId - User ID for organizing files
 * @returns {{ key: string, signedUrl: string, size: number }}
 */
async function uploadExportFile(buffer, filename, contentType, userId = 'anonymous') {
  const timestamp = Date.now();
  const key = `exports/${userId}/${timestamp}-${sanitizeFilename(filename)}`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentDisposition: `attachment; filename="${filename}"`,
    Metadata: {
      'uploaded-at': new Date().toISOString(),
      'user-id': userId,
    },
  }));

  // Generate signed URL (expires after 24h by default)
  const signedUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: SIGNED_URL_EXPIRY }
  );

  return {
    key,
    signedUrl,
    size: buffer.length,
  };
}

/**
 * Delete an export file from R2
 * @param {string} key - Object key in R2
 */
async function deleteExportFile(key) {
  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Get a fresh signed URL for an existing file
 * @param {string} key - Object key in R2
 * @returns {string} Signed URL
 */
async function getSignedDownloadUrl(key) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: SIGNED_URL_EXPIRY }
  );
}

/**
 * Sanitize filename for safe storage
 */
function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

module.exports = {
  uploadExportFile,
  deleteExportFile,
  getSignedDownloadUrl,
};
