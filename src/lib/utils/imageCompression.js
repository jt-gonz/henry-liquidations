/**
 * Client-side image compression for admin product uploads.
 * Browser-only (FileReader/Image/canvas) — never import this from server code.
 */

const TARGET_BYTES = 400 * 1024;
const MAX_DIMENSIONS = [1600, 1400, 1200, 1000];
const JPEG_QUALITIES = [0.8, 0.7, 0.6, 0.5];
const WEBP_QUALITY = 0.82;

/** @type {Promise<boolean> | undefined} */
let webpSupportPromise;

/** Feature-detect real WebP *encoding* support (Safari <17 silently falls back to PNG). */
function supportsWebpEncoding() {
	if (!webpSupportPromise) {
		webpSupportPromise = new Promise((resolve) => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = 1;
				canvas.height = 1;
				canvas.toBlob((blob) => resolve(!!blob && blob.type === 'image/webp'), 'image/webp');
			} catch {
				resolve(false);
			}
		});
	}
	return webpSupportPromise;
}

/** @param {File} file @returns {Promise<HTMLImageElement>} */
function loadImage(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Could not read file'));
		reader.onload = (e) => {
			const result = e.target?.result;
			if (!result) return reject(new Error('Empty file'));
			const img = new Image();
			img.onerror = () => reject(new Error('Could not decode image'));
			img.onload = () => resolve(img);
			img.src = result.toString();
		};
		reader.readAsDataURL(file);
	});
}

/**
 * Draw `img` onto a canvas, capping the LARGER of width/height at `maxDim`
 * (portrait photos are just as common as landscape from phone cameras).
 * @param {HTMLImageElement} img @param {number} maxDim
 */
function drawToCanvas(img, maxDim) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	let width = img.naturalWidth || img.width;
	let height = img.naturalHeight || img.height;

	if (width > maxDim || height > maxDim) {
		if (width >= height) {
			height = Math.round((height * maxDim) / width);
			width = maxDim;
		} else {
			width = Math.round((width * maxDim) / height);
			height = maxDim;
		}
	}

	canvas.width = width;
	canvas.height = height;
	ctx.drawImage(img, 0, 0, width, height);
	return canvas;
}

/** @param {HTMLCanvasElement} canvas @param {string} mimeType @param {number} quality @returns {Promise<Blob | null>} */
function encode(canvas, mimeType, quality) {
	return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

/**
 * Compress an image file for upload: resizes to a reasonable max dimension and
 * re-encodes (WebP when the browser genuinely supports it, JPEG otherwise),
 * stepping quality and then dimensions down until a target size is hit or the
 * options are exhausted. Never fails outward — falls back to the original file
 * if the image can't be decoded or compression doesn't actually help.
 *
 * @param {File} file
 * @param {{ targetBytes?: number }} [options]
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number, compressed: boolean }>}
 */
export async function compressImage(file, options = {}) {
	const targetBytes = options.targetBytes ?? TARGET_BYTES;
	const originalSize = file.size;

	/** @type {HTMLImageElement} */
	let img;
	try {
		img = await loadImage(file);
	} catch {
		return { file, originalSize, compressedSize: originalSize, compressed: false };
	}

	const useWebp = await supportsWebpEncoding();
	const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
	const extension = useWebp ? 'webp' : 'jpg';
	const qualities = useWebp ? [WEBP_QUALITY] : JPEG_QUALITIES;

	/** @type {Blob | null} */
	let best = null;

	outer: for (const maxDim of MAX_DIMENSIONS) {
		const canvas = drawToCanvas(img, maxDim);
		if (!canvas) break;
		for (const quality of qualities) {
			const blob = await encode(canvas, mimeType, quality);
			if (!blob) continue;
			if (!best || blob.size < best.size) best = blob;
			if (blob.size <= targetBytes) break outer;
		}
	}

	if (!best) {
		return { file, originalSize, compressedSize: originalSize, compressed: false };
	}

	// Never ship a "compressed" file that's actually bigger (can happen on
	// tiny or already-optimized source images).
	if (best.size >= originalSize) {
		return { file, originalSize, compressedSize: originalSize, compressed: false };
	}

	const baseName = file.name.replace(/\.[^./]+$/, '') || 'image';
	const compressedFile = new File([best], `${baseName}.${extension}`, {
		type: mimeType,
		lastModified: Date.now()
	});

	return {
		file: compressedFile,
		originalSize,
		compressedSize: compressedFile.size,
		compressed: true
	};
}

/** @param {number} bytes */
export function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
