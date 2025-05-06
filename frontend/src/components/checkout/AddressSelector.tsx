import { Address } from "../../types/address";
import AddressDisplay from "./AddressDisplay";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  label: string;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedAddressId,
  onChange,
  disabled = false,
  label,
}) => {
  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId
  );

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <select
          value={selectedAddressId || ""}
          onChange={onChange}
          disabled={disabled}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select Address</option>
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.fullName} - {address.addressLine1}, {address.city},{" "}
              {address.state} {address.postalCode}, {address.country}
              {address.isDefault ? " (Default)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedAddress && <AddressDisplay address={selectedAddress} />}
    </div>
  );
};

export default AddressSelector;
