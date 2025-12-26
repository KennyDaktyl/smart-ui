import { useState } from "react";
import { adminApi } from "@/api/adminApi";
import { UserFormPayload } from "../types/userForm";

type Mode = "create" | "edit";

export function useUserMutation(
  mode: Mode,
  userId?: number,
  onSuccess?: () => void
) {
  const [loading, setLoading] = useState(false);

  const submit = async (payload: UserFormPayload) => {
    try {
      setLoading(true);

      if (mode === "create") {
        await adminApi.createUser(payload);
      } else {
        if (!userId) throw new Error("User id is required for edit mode");
        await adminApi.updateUser(userId, payload);
      }

      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
  };
}
