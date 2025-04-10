import { APP_NAME } from "../../../utils/appName";

const TeamSection = () => {
  return (
    <div className="bg-gray-50 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Meet Our Team
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-500">
            Passionate professionals dedicated to creating the best marketplace
            experience.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Team Member 1 */}
          <div className="flex flex-col items-center lg:col-start-2">
            <div className="h-40 w-40 rounded-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                alt="CEO"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Mark Aldrin Aboganda
              </h3>
              <p className="text-base text-indigo-600">CEO & Founder</p>
              <p className="mt-3 text-base text-gray-500">
                With over 2 years of web development experience, Mark founded 
                {APP_NAME} with a vision to empower vendors globally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSection;
