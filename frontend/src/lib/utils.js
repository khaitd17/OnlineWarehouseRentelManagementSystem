import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat("vi-VN",{
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(date));
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN",{
        style: "currency",
        currency: "VND",
    }).format(amount);
}
