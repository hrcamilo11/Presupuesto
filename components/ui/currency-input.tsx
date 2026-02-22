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
                // Only update display if the current display doesn't match the new value conceptually
                // This prevents cursor jumping when typing "50000" -> "50.000"
                const rawDisplay = parseCOP(displayValue);
                if (rawDisplay !== value.toString()) {
                    const formatted = value !== "" ? formatCOP(value) : "";
                    setDisplayValue(formatted);
                }
            }
        }, [value, displayValue]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let val = e.target.value;

            // UX: If user types a dot, convert it to comma for decimal
            if (val.endsWith(".")) {
                val = val.slice(0, -1) + ",";
            }

            // If the user just typed a comma at the end, keep it in display but don't parse yet
            if (val.endsWith(",")) {
                setDisplayValue(val);
                return;
            }

            const rawValue = parseCOP(val);
            const formattedValue = rawValue ? formatCOP(rawValue) : "";

            // If the input is empty
            if (val === "" || rawValue === "") {
                setDisplayValue("");
                if (onChange) onChange(0);
                return;
            }

            // Update display immediately to feedback formatting
            setDisplayValue(formattedValue);

            if (onChange) {
                const num = parseFloat(rawValue);
                // Don't trigger change if it's not a valid number, or if it's just a trailing comma case handled above
                if (!isNaN(num)) {
                    onChange(num);
                }
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
