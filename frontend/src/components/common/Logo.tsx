import { Link } from "react-router-dom";
import { APP_NAME } from "../../utils/appName";
import { PUBLIC_ENDPOINTS } from "../../utils/constants";

interface LogoProps {
  isScrolled: boolean;
}

const Logo = ({ isScrolled }: LogoProps) => {
  return (
    <div className="flex-shrink-0">
      <Link to={PUBLIC_ENDPOINTS.HOME} className="flex items-center">
        <span
          className={`font-bold text-xl ${
            isScrolled ? "text-gray-900" : "text-primary-600"
          }`}
        >
          {APP_NAME}
        </span>
      </Link>
    </div>
  );
};

export default Logo;
