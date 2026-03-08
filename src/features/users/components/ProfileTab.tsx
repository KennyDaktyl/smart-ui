import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MenuItem, Stack, Typography } from "@mui/material";

import { userApi } from "@/api/userApi";
import FormCard from "@/components/forms/FormCard";
import FormTextField from "@/components/forms/FormTextField";
import FormSubmitButton from "@/components/forms/FormSubmitButton";

import { EnergyPriceUnit, ProfileForm } from "../types/profile";

const normalize = (v?: string) =>
  v && v.trim() !== "" ? v : null;
const normalizeDecimal = (v?: string) => {
  if (!v || v.trim() === "") return null;
  const normalized = v.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const ENERGY_PRICE_UNITS: EnergyPriceUnit[] = ["kWh", "Wh"];

export default function ProfileTab() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<ProfileForm>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userApi.getUserDetails().then((res) => {
      const nextProfile = res.data.profile ?? null;
      setProfile(
        nextProfile
          ? {
              ...nextProfile,
              energy_price_amount:
                nextProfile.energy_price_amount != null
                  ? String(nextProfile.energy_price_amount)
                  : "",
              energy_price_currency: nextProfile.energy_price_currency ?? "PLN",
              energy_price_unit: nextProfile.energy_price_unit ?? "kWh",
            }
          : {
              energy_price_amount: "",
              energy_price_currency: "PLN",
              energy_price_unit: "kWh",
            }
      );
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
    if (
      profile.energy_price_amount &&
      normalizeDecimal(profile.energy_price_amount) == null
    ) {
      e.energy_price_amount = t("account.profile.errors.energyPriceAmount");
    }
    if (
      profile.energy_price_currency &&
      profile.energy_price_currency.trim().length < 3
    ) {
      e.energy_price_currency = t("account.profile.errors.energyPriceCurrency");
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
        energy_price_amount: normalizeDecimal(profile.energy_price_amount),
        energy_price_currency: normalize(profile.energy_price_currency)?.toUpperCase(),
        energy_price_unit:
          normalizeDecimal(profile.energy_price_amount) != null
            ? profile.energy_price_unit ?? "kWh"
            : null,
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

      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.primary">
          {t("account.profile.energyPriceTitle")}
        </Typography>

        <FormTextField
          label={t("account.profile.energyPriceAmount")}
          value={profile.energy_price_amount || ""}
          error={!!errors.energy_price_amount}
          helperText={
            errors.energy_price_amount || t("account.profile.energyPriceHint")
          }
          onChange={(e) =>
            setProfile({ ...profile, energy_price_amount: e.target.value })
          }
        />

        <FormTextField
          select
          label={t("account.profile.energyPriceUnit")}
          value={profile.energy_price_unit || "kWh"}
          onChange={(e) =>
            setProfile({
              ...profile,
              energy_price_unit: e.target.value as EnergyPriceUnit,
            })
          }
        >
          {ENERGY_PRICE_UNITS.map((unit) => (
            <MenuItem key={unit} value={unit}>
              {unit}
            </MenuItem>
          ))}
        </FormTextField>

        <FormTextField
          label={t("account.profile.energyPriceCurrency")}
          value={profile.energy_price_currency || "PLN"}
          error={!!errors.energy_price_currency}
          helperText={errors.energy_price_currency}
          onChange={(e) =>
            setProfile({
              ...profile,
              energy_price_currency: e.target.value.toUpperCase(),
            })
          }
        />
      </Stack>

      <FormSubmitButton loading={loading} onClick={handleSave}>
        {t("common.save")}
      </FormSubmitButton>
    </FormCard>
  );
}
