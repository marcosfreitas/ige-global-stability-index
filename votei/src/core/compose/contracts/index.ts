import type { StyleId } from '../entities/style';

export interface IPhotoStylizer {
  /**
   * Restyles a photo. Implementations must return the original bytes rather
   * than throw when the model declines or returns nothing: a failed restyle
   * costs the buyer a style, never their purchase.
   */
  stylize(params: { photo: Uint8Array; styleId: StyleId }): Promise<{
    bytes: Uint8Array;
    applied: boolean;
  }>;
}
