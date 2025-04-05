import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Tab } from '@headlessui/react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

// Define schemas for form validation
const ProfileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
});

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  passwordConfirmation: Yup.string()
    .oneOf([Yup.ref('newPassword'), undefined], 'Passwords must match')
    .required('Password confirmation is required'),
});

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unable to load profile</h2>
          <p className="text-gray-600">Please try logging in again.</p>
          <Link to="/login" className="mt-4 inline-block bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleProfileUpdate = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setProfileUpdateError(null);
      setProfileUpdateSuccess(false);
      
      // Extract only the fields we want to update
      const { firstName, lastName, email, phone } = values;
      
      await updateProfile({ firstName, lastName, email, phone });
      
      setProfileUpdateSuccess(true);
    } catch (error) {
      setProfileUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (values: any, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void, resetForm: () => void }) => {
    try {
      setPasswordUpdateError(null);
      setPasswordUpdateSuccess(false);
      
      // Call the change password API
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        passwordConfirmation: values.passwordConfirmation,
      });
      
      setPasswordUpdateSuccess(true);
      resetForm();
    } catch (error) {
      setPasswordUpdateError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">My Profile</h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account information and security settings.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-indigo-50 p-1">
              <Tab 
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700',
                    selected
                      ? 'bg-white shadow'
                      : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
                  )
                }
              >
                Profile Information
              </Tab>
              <Tab 
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700',
                    selected
                      ? 'bg-white shadow'
                      : 'text-indigo-500 hover:bg-white/[0.12] hover:text-indigo-600'
                  )
                }
              >
                Password & Security
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-2">
              <Tab.Panel className={classNames(
                'rounded-xl bg-white p-6 shadow',
              )}>
                {profileUpdateSuccess && (
                  <div className="rounded-md bg-green-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Update successful</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your profile information has been updated successfully.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {profileUpdateError && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{profileUpdateError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Formik
                  initialValues={{
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                  }}
                  validationSchema={ProfileSchema}
                  onSubmit={handleProfileUpdate}
                  enableReinitialize
                >
                  {({ isSubmitting }) => (
                    <Form>
                      <div className="grid grid-cols-6 gap-6">
                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First name
                          </label>
                          <Field
                            type="text"
                            name="firstName"
                            id="firstName"
                            autoComplete="given-name"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last name
                          </label>
                          <Field
                            type="text"
                            name="lastName"
                            id="lastName"
                            autoComplete="family-name"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="lastName" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div className="col-span-6 sm:col-span-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                          </label>
                          <Field
                            type="email"
                            name="email"
                            id="email"
                            autoComplete="email"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div className="col-span-6 sm:col-span-4">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone number
                          </label>
                          <Field
                            type="text"
                            name="phone"
                            id="phone"
                            autoComplete="tel"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                          {isSubmitting ? 'Saving...' : 'Save profile'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </Tab.Panel>

              <Tab.Panel className={classNames(
                'rounded-xl bg-white p-6 shadow',
              )}>
                {passwordUpdateSuccess && (
                  <div className="rounded-md bg-green-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Password changed</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your password has been changed successfully.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {passwordUpdateError && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{passwordUpdateError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Formik
                  initialValues={{
                    currentPassword: '',
                    newPassword: '',
                    passwordConfirmation: '',
                  }}
                  validationSchema={PasswordSchema}
                  onSubmit={handlePasswordUpdate}
                >
                  {({ isSubmitting }) => (
                    <Form>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Current password
                          </label>
                          <Field
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="currentPassword" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            New password
                          </label>
                          <Field
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="newPassword" component="div" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
                            Confirm new password
                          </label>
                          <Field
                            type="password"
                            name="passwordConfirmation"
                            id="passwordConfirmation"
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="passwordConfirmation" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                          {isSubmitting ? 'Updating password...' : 'Update password'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
