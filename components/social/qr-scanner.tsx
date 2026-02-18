"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: unknown) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                onScan(decodedText);
                if (scannerRef.current) {
                    scannerRef.current.clear();
                }
            },
            (error) => {
                if (onError) onError(error);
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
            }
        };
    }, [onScan, onError]);

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            <div id="qr-reader" className="w-full"></div>
        </div>
    );
}
