import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@mui/material";

import { userApi } from "@/api/userApi";
import FormCard from "@/components/forms/FormCard";
import FormTextField from "@/components/forms/FormTextField";
import FormSubmitButton from "@/components/forms/FormSubmitButton";

import { ProfileForm } from "../types/profile";

const normalize = (v?: string) =>
  v && v.trim() !== "" ? v : null;

export default function ProfileTab() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<ProfileForm>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userApi.getUserDetails().then((res) => {
      setProfile(res.data.profile ?? {});
    });
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (profile.first_name && profile.first_name.length < 2) {
      e.first_name = t("account.profile.errors.firstName");
    }
    if (profile.last_name && profile.last_name.length < 2) {
      e.last_name = t("account.profile.errors.lastName");
    }
    if (profile.phone_number && !/^\d{9,}$/.test(profile.phone_number)) {
      e.phone_number = t("account.profile.errors.phone");
    }
    if (profile.company_name && profile.company_name.length < 2) {
      e.company_name = t("account.profile.errors.companyName");
    }
    if (profile.company_vat && profile.company_vat.length < 8) {
      e.company_vat = t("account.profile.errors.companyVat");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setSuccess(false);
    if (!validate()) return;

    try {
      setLoading(true);
      await userApi.updateProfileDetails({
        first_name: normalize(profile.first_name),
        last_name: normalize(profile.last_name),
        phone_number: normalize(profile.phone_number),
        company_name: normalize(profile.company_name),
        company_vat: normalize(profile.company_vat),
        company_address: normalize(profile.company_address),
      });
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormCard
      successMessage={success ? t("account.profile.saved") : undefined}
    >
      <FormTextField
        label={t("account.profile.firstName")}
        value={profile.first_name || ""}
        error={!!errors.first_name}
        helperText={errors.first_name}
        onChange={(e) =>
          setProfile({ ...profile, first_name: e.target.value })
        }
      />

      <FormTextField
        label={t("account.profile.lastName")}
        value={profile.last_name || ""}
        error={!!errors.last_name}
        helperText={errors.last_name}
        onChange={(e) =>
          setProfile({ ...profile, last_name: e.target.value })
        }
      />

      <FormTextField
        label={t("account.profile.phone")}
        value={profile.phone_number || ""}
        error={!!errors.phone_number}
        helperText={errors.phone_number}
        onChange={(e) =>
          setProfile({ ...profile, phone_number: e.target.value })
        }
      />

      <FormTextField
        label={t("account.profile.companyName")}
        value={profile.company_name || ""}
        error={!!errors.company_name}
        helperText={errors.company_name}
        onChange={(e) =>
          setProfile({ ...profile, company_name: e.target.value })
        }
      />

      <FormTextField
        label={t("account.profile.companyVat")}
        value={profile.company_vat || ""}
        error={!!errors.company_vat}
        helperText={errors.company_vat}
        onChange={(e) =>
          setProfile({ ...profile, company_vat: e.target.value })
        }
      />

      <FormTextField
        label={t("account.profile.companyAddress")}
        value={profile.company_address || ""}
        multiline
        minRows={3}
        onChange={(e) =>
          setProfile({
            ...profile,
            company_address: e.target.value,
          })
        }
      />

      <FormSubmitButton loading={loading} onClick={handleSave}>
        {t("common.save")}
      </FormSubmitButton>
    </FormCard>
  );
}
