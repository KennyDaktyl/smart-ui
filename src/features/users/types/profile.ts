export type EnergyPriceUnit = "Wh" | "kWh";

export type ProfileForm = {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  company_name?: string;
  company_vat?: string;
  company_address?: string;
  energy_price_amount?: string;
  energy_price_currency?: string;
  energy_price_unit?: EnergyPriceUnit;
};


export type UserProfileResponse = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  company_name?: string | null;
  company_vat?: string | null;
  company_address?: string | null;
  energy_price_amount?: number | null;
  energy_price_currency?: string | null;
  energy_price_unit?: EnergyPriceUnit | null;
};
