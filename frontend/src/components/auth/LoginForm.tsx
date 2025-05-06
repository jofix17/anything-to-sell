import * as Yup from "yup";
import { LoginCredentials } from "../../types/auth";
import { Form, Formik } from "formik";
import { FormField } from "../common/Formik/FormField";
import { CheckboxField } from "../common/Formik/CheckboxField";
import { Link } from "react-router-dom";
import FormSubmitButton from "../common/Formik/FormSubmitButton";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
  rememberMe: Yup.boolean(),
});

const LoginForm: React.FC<{
  initialValues: LoginCredentials & { rememberMe: boolean };
  onSubmit: (
    values: LoginCredentials & { rememberMe: boolean },
    helpers: { setSubmitting: (isSubmitting: boolean) => void }
  ) => Promise<void>;
  isLoading: boolean;
}> = ({ initialValues, onSubmit, isLoading }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={LoginSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-6">
          <FormField
            name="email"
            label="Email"
            type="email"
            disabled={isLoading || isSubmitting}
            required
          />

          <FormField
            name="password"
            label="Password"
            type="password"
            disabled={isLoading || isSubmitting}
            required
          />

          {/* Remember me and forgot password */}
          <div className="flex items-center justify-between">
            <CheckboxField
              name="rememberMe"
              label="Remember me"
              disabled={isLoading || isSubmitting}
            />

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Login button */}
          <FormSubmitButton
            loading={isSubmitting || isLoading}
            disabled={isSubmitting || isLoading}
          >
            Sign in
          </FormSubmitButton>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
