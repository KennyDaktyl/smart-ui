import axios from "axios";

export type ParsedApiError = {
  status?: number;
  message: string;
  detail?: string;
  fieldErrors?: Record<string, string>;
};

const getArrayDetailMessage = (detail: unknown) => {
  if (!Array.isArray(detail)) return undefined;
  const first = detail[0];
  if (first && typeof first === "object" && "msg" in first) {
    return (first as any).msg;
  }
  return undefined;
};

const getObjectDetailMessage = (detail: unknown) => {
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    if ("message" in detail && typeof (detail as any).message === "string") {
      return (detail as any).message;
    }
  }
  return undefined;
};

export function parseApiError(error: unknown): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const loc = Array.isArray(item.loc) ? item.loc : [];
      const field = loc[loc.length - 1];
      if (field && typeof item.msg === "string") {
        fieldErrors[field] = item.msg;
      }
    });
  } else if (detail && typeof detail === "object") {
    Object.entries(detail).forEach(([field, msg]) => {
      if (typeof msg === "string") {
        fieldErrors[field] = msg;
      }
    });
  }

  const detailMessage =
    getArrayDetailMessage(detail) ?? getObjectDetailMessage(detail);

  const message =
    detailMessage ||
    error.response?.data?.message ||
    error.message ||
    "Server error";

  return {
    status,
    message,
    detail: typeof detail === "string" ? detail : undefined,
    fieldErrors:
      Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}
