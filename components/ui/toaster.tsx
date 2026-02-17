"use client";

import { Toaster as SileoToaster } from "sileo";
import "sileo/styles.css";

export function Toaster() {
    return (
        <SileoToaster
            position="bottom-center"
            options={{
                duration: 4000,
            }}
        />
    );
}
