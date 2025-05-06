import { Address } from "../../types/address";

interface AddressDisplayProps {
  address: Address;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address }) => {
  return (
    <div className="mt-3 p-3 border rounded-md bg-gray-50">
      {address.fullName}
      <br />
      {address.addressLine1}
      <br />
      {address.addressLine2 && (
        <>
          {address.addressLine2}
          <br />
        </>
      )}
      {address.city}, {address.state} {address.postalCode}
      <br />
      {address.country}
      <br />
      {address.phoneNumber}
    </div>
  );
};

export default AddressDisplay;