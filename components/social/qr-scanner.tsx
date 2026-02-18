"use client";

import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (error: unknown) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<QrScanner | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        scannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
                onScan(result.data);
            },
            {
                onDecodeError: (error) => {
                    // Solo loguear errores reales, no "No QR code found" que es constante
                    if (typeof error === 'string' && error.includes("No QR code found")) return;
                    if (onError) onError(error);
                },
                highlightScanRegion: true,
                highlightCodeOutline: true,
                preferredCamera: 'environment'
            }
        );

        scannerRef.current.start().catch(err => {
            console.error("Error starting scanner:", err);
            if (onError) onError(err);
        });

        return () => {
            scannerRef.current?.destroy();
            scannerRef.current = null;
        };
    }, [onScan, onError]);

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-border bg-black relative aspect-square flex items-center justify-center">
            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
            />
            <div className="absolute inset-0 border-2 border-primary/50 m-12 rounded-xl pointer-events-none" />
        </div>
    );
}
