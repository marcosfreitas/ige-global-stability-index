'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, uploadPhoto } from '../lib/api';
import { ImageDecodeError, resizeImageFile } from '../lib/resize-image';

interface State {
  uploading: boolean;
  error: string | null;
  localPreviewUrl: string | null;
}

export function usePhotoUpload(onUploaded: (photoKey: string) => void) {
  const [state, setState] = useState<State>({
    uploading: false,
    error: null,
    localPreviewUrl: null,
  });

  const previewUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      revokePreview();
    };
  }, [revokePreview]);

  const select = useCallback(
    async (file: File) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, uploading: true, error: null }));

      try {
        const resized = await resizeImageFile(file);

        revokePreview();
        const url = URL.createObjectURL(resized);
        previewUrlRef.current = url;
        setState((prev) => ({ ...prev, localPreviewUrl: url }));

        const { photoKey } = await uploadPhoto(resized, controller.signal);
        if (controller.signal.aborted) return;

        setState((prev) => ({ ...prev, uploading: false }));
        onUploaded(photoKey);
      } catch (err) {
        if (controller.signal.aborted) return;

        const message =
          err instanceof ImageDecodeError || err instanceof ApiRequestError
            ? err.message
            : 'Não foi possível enviar a foto. Tente de novo.';

        setState({ uploading: false, error: message, localPreviewUrl: null });
        revokePreview();
      }
    },
    [onUploaded, revokePreview]
  );

  return { ...state, select };
}
