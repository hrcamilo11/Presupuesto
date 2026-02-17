"use client";

import { Toaster as SileoToaster } from "sileo";
import "sileo/styles.css";

export function Toaster() {
    return (
        <SileoToaster
            position="top-right"
            options={{
                duration: 4000,
            }}
        />
    );
}
