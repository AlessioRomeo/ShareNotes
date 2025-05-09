"use client"

import React from "react"
import { useToast } from "@/hooks/use-toast"
import {
    Toast as ToastUI,
    ToastViewport,
    ToastTitle,
    ToastDescription,
    ToastAction,
} from "@/components/ui/toast"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <>
            <ToastViewport />
            {toasts.map((t) => (
                <ToastUI
                    key={t.id}
                    open={t.open}
                    onOpenChange={t.onOpenChange}
                    {...t}
                >
                    {t.title && <ToastTitle>{t.title}</ToastTitle>}
                    {t.description && <ToastDescription>{t.description}</ToastDescription>}
                    {t.action && <ToastAction altText={""}>{t.action}</ToastAction>}
                </ToastUI>
            ))}
        </>
    )
}
