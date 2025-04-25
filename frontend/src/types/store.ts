export interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logoUrl: string; // matches Rails logo_url
  bannerUrl: string; // matches Rails banner_url
  contactEmail: string; // matches Rails contact_email
  contactPhone: string; // matches Rails contact_phone
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string; // matches Rails postal_code
  createdAt: string; // matches Rails created_at
  updatedAt: string; // matches Rails updated_at
}
