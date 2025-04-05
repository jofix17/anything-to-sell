import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-indigo-800">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1572177812156-58036aae439c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
            alt="People working on laptops"
          />
          <div className="absolute inset-0 bg-indigo-800 mix-blend-multiply" aria-hidden="true" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">About Our Marketplace</h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl">
            A community-driven platform connecting buyers with unique products from verified vendors.
          </p>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-white py-16 px-4 overflow-hidden sm:px-6 lg:px-8 lg:py-24">
        <div className="relative max-w-xl mx-auto">
          <svg
            className="absolute left-full transform translate-x-1/2"
            width={404}
            height={404}
            fill="none"
            viewBox="0 0 404 404"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="85737c0e-0916-41d7-917f-596dc7edfa27"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />
              </pattern>
            </defs>
            <rect width={404} height={404} fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
          </svg>
          <svg
            className="absolute right-full bottom-0 transform -translate-x-1/2"
            width={404}
            height={404}
            fill="none"
            viewBox="0 0 404 404"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="85737c0e-0916-41d7-917f-596dc7edfa28"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect x={0} y={0} width={4} height={4} className="text-gray-200" fill="currentColor" />
              </pattern>
            </defs>
            <rect width={404} height={404} fill="url(#85737c0e-0916-41d7-917f-596dc7edfa28)" />
          </svg>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Our Mission</h2>
            <p className="mt-4 text-lg leading-6 text-gray-500">
              We believe in creating a fair, transparent marketplace where buyers can discover unique products and
              vendors can reach a global audience.
            </p>
          </div>
          <div className="mt-12">
            <p className="text-lg text-gray-500 leading-7">
              Founded in 2023, our marketplace was created with the vision of revolutionizing online shopping by 
              putting people first. We're not just another e-commerce platform — we're building a community where:
            </p>
            <ul className="mt-6 text-lg text-gray-500 space-y-3">
              <li className="flex">
                <svg className="flex-shrink-0 h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-3">Buyers can find unique, high-quality products</span>
              </li>
              <li className="flex">
                <svg className="flex-shrink-0 h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-3">Vendors can showcase their creativity and craftsmanship</span>
              </li>
              <li className="flex">
                <svg className="flex-shrink-0 h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-3">Trust and transparency are at the heart of every transaction</span>
              </li>
              <li className="flex">
                <svg className="flex-shrink-0 h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-3">Customer satisfaction drives every decision we make</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Meet Our Team</h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-500">
              Passionate professionals dedicated to creating the best marketplace experience.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Team Member 1 */}
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 rounded-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                  alt="CEO"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-medium text-gray-900">Alex Johnson</h3>
                <p className="text-base text-indigo-600">CEO & Founder</p>
                <p className="mt-3 text-base text-gray-500">
                  With over 15 years of e-commerce experience, Alex founded our marketplace with a vision to empower vendors globally.
                </p>
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 rounded-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80"
                  alt="CTO"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-medium text-gray-900">Samantha Lee</h3>
                <p className="text-base text-indigo-600">Chief Technology Officer</p>
                <p className="mt-3 text-base text-gray-500">
                  Sam leads our engineering team, ensuring our platform is secure, scalable, and provides a seamless user experience.
                </p>
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 rounded-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1563237023-b1e970526dcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=765&q=80"
                  alt="COO"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-lg font-medium text-gray-900">David Wong</h3>
                <p className="text-base text-indigo-600">Chief Operations Officer</p>
                <p className="mt-3 text-base text-gray-500">
                  David oversees our day-to-day operations, ensuring smooth vendor onboarding and customer satisfaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Trusted by thousands of vendors and buyers
            </h2>
            <p className="mt-3 text-xl text-gray-500 sm:mt-4">
              Our marketplace continues to grow as more people discover the value of our platform.
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">Vendors</dt>
              <dd className="order-1 text-5xl font-extrabold text-indigo-600">2,500+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">Products</dt>
              <dd className="order-1 text-5xl font-extrabold text-indigo-600">50,000+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">Customers</dt>
              <dd className="order-1 text-5xl font-extrabold text-indigo-600">100,000+</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Become a Vendor CTA */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to join our community?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Whether you're a small business owner or a creative looking to reach new customers, our marketplace provides the tools and audience you need to succeed.
          </p>
          <Link
            to="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Become a Vendor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
