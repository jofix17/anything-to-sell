import { Link } from "react-router-dom";

const LoginHeader: React.FC = () => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Or{" "}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          create a new account
        </Link>
      </p>
    </div>
  );
};

export default LoginHeader;
