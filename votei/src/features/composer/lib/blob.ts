/**
 * Data URL rather than `URL.createObjectURL`: an object URL has to be revoked
 * by hand, which means an effect and a ref around every image. A preview is
 * ~80 KB, so the base64 overhead is not worth that complexity.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler a imagem.'));
    reader.readAsDataURL(blob);
  });
}
