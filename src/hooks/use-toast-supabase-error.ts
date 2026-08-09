"use client";

import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export function handleSupabaseError(error: unknown, fallback = "Something went wrong") {
  toast.error(getErrorMessage(error, fallback));
}
