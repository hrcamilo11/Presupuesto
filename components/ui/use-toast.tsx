"use client";

import { sileo } from "sileo";

type ToastOptions = {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: "default" | "destructive";
};

function toast({ title, description, variant = "default" }: ToastOptions) {
    const message =
        typeof title === "string" ? title : title != null ? String(title) : "Notificación";
    const desc =
        typeof description === "string"
            ? description
            : description != null
              ? String(description)
              : undefined;

    const id =
        variant === "destructive"
            ? sileo.error({ title: message, description: desc })
            : sileo.success({ title: message, description: desc });

    return {
        id,
        dismiss: () => sileo.dismiss(id),
        update: (props: ToastOptions) => {
            sileo.dismiss(id);
            toast(props);
        },
    };
}

function useToast() {
    return {
        toast,
        dismiss: (toastId?: string) => toastId && sileo.dismiss(toastId),
        toasts: [],
    };
}

export { useToast, toast };
