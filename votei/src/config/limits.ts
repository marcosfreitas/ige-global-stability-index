export const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

/**
 * What the server accepts. HEIC is deliberately absent: sharp's prebuilt
 * binaries ship without a HEIF decoder, so the browser re-encodes to JPEG on
 * the way out (see the composer hook in features/composer).
 */
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Stored photos are normalised down to this edge before they are persisted. */
export const STORED_PHOTO_MAX_EDGE = 1600;

/** Output edge for the paid render. Square — the target is a profile picture. */
export const OUTPUT_SIZE = 1080;

/** Preview is deliberately smaller and watermarked. */
export const PREVIEW_SIZE = 720;

/** A Pix charge and its uploaded photo both die after this. */
export const ORDER_TTL_SECONDS = 2 * 60 * 60;
