// lib/forms.ts
export type AboutMeForm = { bio?: string };
export type AddressForm = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
};
export type BirthdateForm = { date?: string };

export type FormValues = {
  email?: string;
  password?: string;
  AboutMe?: AboutMeForm;
  Address?: AddressForm;
  Birthdate?: BirthdateForm;
};
