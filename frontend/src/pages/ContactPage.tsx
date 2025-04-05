import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ContactSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  subject: Yup.string().required('Subject is required'),
  message: Yup.string().required('Message is required').min(10, 'Message is too short'),
});

const ContactPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void, resetForm: () => void }) => {
    try {
      setError(null);
      
      // In a real app, you would make an API call to send the contact form
      // For now, we'll just simulate a successful submission after a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log('Contact form submitted:', values);
      resetForm();
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit contact form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Get in touch</h2>
            <div className="mt-3">
              <p className="text-lg text-gray-500">
                Have a question, suggestion, or want to partner with us? We'd love to hear from you!
              </p>
            </div>
            <div className="mt-9">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3 text-base text-gray-500">
                  <p>support@yourmarketplace.com</p>
                  <p className="mt-1">For general inquiries and customer support</p>
                </div>
              </div>
              <div className="mt-6 flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="ml-3 text-base text-gray-500">
                  <p>+1 (555) 123-4567</p>
                  <p className="mt-1">Mon-Fri 9am to 6pm EST</p>
                </div>
              </div>
              <div className="mt-6 flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3 text-base text-gray-500">
                  <p>partners@yourmarketplace.com</p>
                  <p className="mt-1">For business partnerships and vendor inquiries</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 sm:mt-16 md:mt-0">
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Send us a message</h2>
            <div className="mt-9">
              {isSubmitted ? (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Message sent successfully</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Thank you for contacting us! We will get back to you as soon as possible.</p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setIsSubmitted(false)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Send another message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Formik
                  initialValues={{
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                  }}
                  validationSchema={ContactSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form className="grid grid-cols-1 gap-y-6">
                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Error</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First name
                          </label>
                          <div className="mt-1">
                            <Field
                              type="text"
                              name="firstName"
                              id="firstName"
                              autoComplete="given-name"
                              className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                            />
                            <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last name
                          </label>
                          <div className="mt-1">
                            <Field
                              type="text"
                              name="lastName"
                              id="lastName"
                              autoComplete="family-name"
                              className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                            />
                            <ErrorMessage name="lastName" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <div className="mt-1">
                            <Field
                              type="email"
                              name="email"
                              id="email"
                              autoComplete="email"
                              className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                            />
                            <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone (optional)
                          </label>
                          <div className="mt-1">
                            <Field
                              type="text"
                              name="phone"
                              id="phone"
                              autoComplete="tel"
                              className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                            />
                            <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                            Subject
                          </label>
                          <div className="mt-1">
                            <Field
                              type="text"
                              name="subject"
                              id="subject"
                              className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                            />
                            <ErrorMessage name="subject" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                            Message
                          </label>
                          <div className="mt-1">
                            <Field
                              as="textarea"
                              name="message"
                              id="message"
                              rows={4}
                              className="py-3 px-4 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border border-gray-300 rounded-md"
                            />
                            <ErrorMessage name="message" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Can't find the answer you're looking for? Contact our{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  customer support
                </a>{' '}
                team.
              </p>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-2">
              <dl className="space-y-12">
                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    How do I become a vendor?
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    Simply register for an account and select "Vendor" as your account type. After completing your profile and store information, our team will review your application and approve it within 24-48 hours.
                  </dd>
                </div>

                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    What are the fees for selling on your marketplace?
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    We charge a 10% commission on each sale. There are no monthly fees or listing fees, so you only pay when you make a sale.
                  </dd>
                </div>

                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    How long does shipping take?
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    Shipping times vary by vendor and location. Each product page displays the estimated shipping time. Most domestic orders arrive within 3-5 business days, while international shipping may take 7-14 business days.
                  </dd>
                </div>

                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    What is your return policy?
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    Our marketplace has a 30-day return policy for most items. Some products may have specific return conditions set by the vendor, which will be noted on the product page.
                  </dd>
                </div>

                <div>
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    When do vendors get paid?
                  </dt>
                  <dd className="mt-2 text-base text-gray-500">
                    Vendors receive payments for orders after a 7-day processing period once the order is marked as delivered. Payments are made via direct deposit or PayPal.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Location Map */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="h-96 w-full">
              {/* Placeholder for an actual map integration */}
              <div className="h-full w-full flex items-center justify-center bg-gray-300">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Our Headquarters</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    123 Market Street, Suite 456<br />
                    San Francisco, CA 94103<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
