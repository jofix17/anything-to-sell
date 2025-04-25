export interface Address {
  id: string;
  userId: string; // matches Rails user_id
  fullName: string; // matches Rails full_name
  addressLine1: string; // matches Rails address_line1
  addressLine2?: string; // matches Rails address_line2
  city: string;
  state: string;
  postalCode: string; // matches Rails postal_code
  country: string;
  phoneNumber: string; // matches Rails phone_number
  isDefault: boolean; // matches Rails is_default
}
