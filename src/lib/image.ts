import imageCompression from 'browser-image-compression';

/** Photo from the tablet camera, shrunk to ~300 KB JPEG and returned as base64 (no data: prefix). */
export async function photoToBase64(file: File): Promise<string> {
  const small = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1600, fileType: 'image/jpeg', useWebWorker: true });
  const buf = new Uint8Array(await small.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
