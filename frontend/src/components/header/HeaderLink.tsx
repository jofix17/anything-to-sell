import { Link } from "react-router-dom";

interface HeaderLinkProps {
  to: string;
  title: string;
  isScrolled?: boolean;
}

const HeaderLink = ({ isScrolled, to, title }: HeaderLinkProps) => {
  return (
    <Link
      to={to}
      className={`text-sm font-semibold ${
        isScrolled ? "text-gray-700 hover:text-gray-900" : "text-primary-600"
      }`}
    >
      {title}
    </Link>
  );
};

export default HeaderLink;
