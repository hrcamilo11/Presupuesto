"use client";

/**
 * Logo de la franquicia de tarjeta (Visa, Mastercard, etc.).
 * Se muestra en la tarjeta en lugar del color por franquicia.
 */

const brandKey = (brand: string | null | undefined) =>
    brand?.toLowerCase().trim() || "other";

interface CardBrandLogoProps {
    brand: string | null | undefined;
    className?: string;
    /** Si la tarjeta es oscura (gradiente), el logo puede usar variante clara */
    dark?: boolean;
}

export function CardBrandLogo({ brand, className = "", dark = false }: CardBrandLogoProps) {
    const key = brandKey(brand);
    const sizeClass = "h-6 w-auto";
    const baseClass = `${sizeClass} ${className}`.trim();

    switch (key) {
        case "visa":
            return (
                <span className={`inline-flex items-center ${baseClass}`} aria-label="Visa">
                    <VisaLogo dark={dark} className="h-5" />
                </span>
            );
        case "mastercard":
            return (
                <span className={`inline-flex items-center ${baseClass}`} aria-label="Mastercard">
                    <MastercardLogo dark={dark} className="h-5" />
                </span>
            );
        case "amex":
            return (
                <span className={`inline-flex items-center ${baseClass}`} aria-label="American Express">
                    <AmexLogo dark={dark} className="h-5" />
                </span>
            );
        case "diners":
        case "discover":
        case "jcb":
        case "unionpay":
        case "maestro":
        default:
            return (
                <span className={`inline-flex items-center font-semibold text-[10px] uppercase tracking-wider opacity-90 ${baseClass}`} aria-label={brand || "Tarjeta"}>
                    {key === "other" ? "••••" : key}
                </span>
            );
    }
}

function VisaLogo({ dark, className }: { dark: boolean; className?: string }) {
    const fill = dark ? "#fff" : "#1A1F71";
    return (
        <svg viewBox="0 0 40 14" fill="none" className={className} role="img">
            <text x="0" y="11" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill={fill} letterSpacing="0.05em">VISA</text>
        </svg>
    );
}

function MastercardLogo({ dark, className }: { dark: boolean; className?: string }) {
    const red = dark ? "rgba(255,255,255,0.95)" : "#EB001B";
    const yellow = dark ? "rgba(255,255,255,0.7)" : "#F79E1B";
    return (
        <svg viewBox="0 0 24 16" fill="none" className={className} role="img">
            <circle cx="9" cy="8" r="6.5" fill={red} />
            <circle cx="15" cy="8" r="6.5" fill={yellow} opacity={dark ? 0.9 : 0.8} />
            <path d="M12 4.2a6 6 0 0 1 0 7.6 6 6 0 0 1 0-7.6z" fill={dark ? "rgba(255,255,255,0.6)" : "#FF5F00"} />
        </svg>
    );
}

function AmexLogo({ dark, className }: { dark: boolean; className?: string }) {
    const fill = dark ? "#fff" : "#006FCF";
    return (
        <svg viewBox="0 0 52 14" fill="none" className={className} role="img">
            <text x="0" y="11" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill={fill} letterSpacing="0.02em">AMEX</text>
        </svg>
    );
}
