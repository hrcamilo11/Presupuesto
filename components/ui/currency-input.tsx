"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";
import { formatCOP, parseCOP } from "@/lib/utils";

interface CurrencyInputProps extends Omit<InputProps, "onChange" | "value" | "defaultValue"> {
    value?: number | string;
    defaultValue?: number | string;
    onChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, defaultValue, onChange, className, ...props }, ref) => {
        // Local display value (formatted)
        const [displayValue, setDisplayValue] = React.useState<string>(() => {
            const initial = value ?? defaultValue ?? "";
            return initial !== "" ? formatCOP(initial) : "";
        });

        // Sync with external value changes
        React.useEffect(() => {
            if (value !== undefined) {
                const formatted = value !== "" ? formatCOP(value) : "";
                if (formatted !== displayValue) {
                    setDisplayValue(formatted);
                }
            }
        }, [value, displayValue]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = parseCOP(e.target.value);
            const formattedValue = rawValue ? formatCOP(rawValue) : "";

            setDisplayValue(formattedValue);

            if (onChange) {
                onChange(rawValue ? parseFloat(rawValue) : 0);
            }
        };

        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                </span>
                <Input
                    {...props}
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    className={`${className} pl-7`}
                    placeholder="0"
                />
            </div>
        );
    }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
