export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_MB = 5;

/**
 * يتحقق من نوع وحجم الصورة قبل القص.
 * يرجع رسالة خطأ بالعربي، أو null لو الملف سليم.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'نوع الملف غير مدعوم، يرجى اختيار صورة (JPG أو PNG أو WEBP)';
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `حجم الصورة كبير، الحد الأقصى ${MAX_IMAGE_SIZE_MB} ميجا`;
  }
  return null;
}

/** يحول الـ Blob الناتج من القص إلى File باسم مبني على اسم الملف الأصلي */
export function blobToImageFile(blob: Blob, originalName: string): File {
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'image';
  const extension = blob.type === 'image/png' ? 'png' : 'jpg';
  return new File([blob], `${baseName}.${extension}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}
