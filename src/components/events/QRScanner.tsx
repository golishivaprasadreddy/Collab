import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onScan: (text: string) => void;
  onError?: (e: string) => void;
}

export function QRScanner({ onScan, onError }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const id = "qr-reader-" + Math.random().toString(36).slice(2, 8);
    ref.current.id = id;
    const scanner = new Html5Qrcode(id);
    scannerRef.current = scanner;
    let cancelled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (!cancelled) onScan(decoded);
        },
        () => undefined
      )
      .catch((e) => onError?.(String(e)));

    return () => {
      cancelled = true;
      Promise.resolve(scanner.stop()).catch(() => undefined).finally(() => {
        try {
          scanner.clear();
        } catch {
          // Ignore cleanup errors from the QR scanner.
        }
      });
    };
  }, [onScan, onError]);

  return <div ref={ref} className="w-full rounded-xl overflow-hidden bg-black" />;
}
