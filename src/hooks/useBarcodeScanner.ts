'use client';

import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
}

export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // We only care about alphanumeric characters (barcodes are usually numeric or alphanumeric)
      const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);
      const isEnter = e.key === 'Enter';

      if (!isAlphanumeric && !isEnter) {
        // Clear buffer on other keys
        bufferRef.current = [];
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Hardware scanners send characters very rapidly (usually < 30ms apart)
      // If the difference is too large, it is likely manual typing, so reset the buffer
      if (bufferRef.current.length > 0 && timeDiff > 50) {
        bufferRef.current = [];
      }

      if (isEnter) {
        if (bufferRef.current.length >= 8) {
          const barcode = bufferRef.current.join('');
          console.log('[Barcode Scanner] Scanned:', barcode);
          onScan(barcode);
          
          // Clear active element focus to prevent accidental form submits or double enters
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
        bufferRef.current = [];
      } else {
        bufferRef.current.push(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, enabled]);
}

export default useBarcodeScanner;
