import { Form, Formik } from "formik";
import { Address } from "../../types/address";
import * as Yup from "yup";
import { FormField } from "../common/Formik/FormField";
import { SelectField } from "../common/Formik/SelectField.";
import { CheckboxField } from "../common/Formik/CheckboxField";
import FormSubmitButton from "../common/Formik/FormSubmitButton";

// Address form validation schema
const AddressFormSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required"),
  addressLine1: Yup.string().required("Address line 1 is required"),
  addressLine2: Yup.string(),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  postalCode: Yup.string().required("Postal code is required"),
  country: Yup.string().required("Country is required"),
  phoneNumber: Yup.string().required("Phone number is required"),
  isDefault: Yup.boolean(),
});

interface AddressFormProps {
  initialValues: Omit<Address, "id" | "userId">;
  onSubmit: (values: Omit<Address, "id" | "userId">) => Promise<void>;
  isLoading: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={AddressFormSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error("Error in address form submission:", error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4 border rounded-md p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="fullName"
              label="Full Name"
              required
              disabled={isLoading || isSubmitting}
            />

            <FormField
              name="phoneNumber"
              label="Phone Number"
              required
              disabled={isLoading || isSubmitting}
            />

            <div className="md:col-span-2">
              <FormField
                name="addressLine1"
                label="Address Line 1"
                required
                disabled={isLoading || isSubmitting}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                name="addressLine2"
                label="Address Line 2 (Optional)"
                disabled={isLoading || isSubmitting}
              />
            </div>

            <FormField
              name="city"
              label="City"
              required
              disabled={isLoading || isSubmitting}
            />

            <FormField
              name="state"
              label="State/Province"
              required
              disabled={isLoading || isSubmitting}
            />

            <FormField
              name="postalCode"
              label="Postal Code"
              required
              disabled={isLoading || isSubmitting}
            />

            <SelectField
              name="country"
              label="Country"
              required
              disabled={isLoading || isSubmitting}
              options={[
                { value: "", label: "Select Country" },
                { value: "PH", label: "Philippines" },
              ]}
            />

            <div className="md:col-span-2">
              <CheckboxField
                name="isDefault"
                label="Set as default address"
                disabled={isLoading || isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <FormSubmitButton
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
            >
              Save Address
            </FormSubmitButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default AddressForm;