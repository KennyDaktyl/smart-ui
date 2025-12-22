import axios from "axios";

type ParsedError = {
  message: string;
  fieldErrors?: Record<string, string>;
};

export const parseApiError = (error: unknown): ParsedError => {
  if (!axios.isAxiosError(error)) {
    return { message: "Something went wrong. Please try again." };
  }

  const status = error.response?.status;
  if (status === 401) {
    return { message: "Your session expired. Please log in again." };
  }
  if (status === 500) {
    return { message: "Server error. Please try again later." };
  }

  const detail = error.response?.data?.detail;
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(detail)) {
    detail.forEach((item) => {
      const loc = Array.isArray(item.loc) ? item.loc : [];
      const field = loc[loc.length - 1];
      if (field) {
        fieldErrors[field] = item.msg ?? "Invalid value.";
      }
    });
  } else if (typeof detail === "string") {
    return { message: detail };
  } else if (detail && typeof detail === "object") {
    Object.entries(detail).forEach(([field, msg]) => {
      if (typeof msg === "string") {
        fieldErrors[field] = msg;
      }
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { message: "Please check the highlighted fields.", fieldErrors };
  }

  if (status === 422) {
    return { message: "Invalid input. Please review the form." };
  }

  return { message: "Unable to complete the request. Please try again." };
};
