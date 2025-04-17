import React from "react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  name: string;
  path: string;
  isLast?: boolean;
}

interface ProductBreadcrumbProps {
  items: BreadcrumbItem[];
}

const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="text-sm mb-6">
      <ol className="list-none p-0 inline-flex flex-wrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {!item.isLast ? (
              <>
                <Link
                  to={item.path}
                  className="text-gray-500 hover:text-blue-600"
                >
                  {item.name}
                </Link>
                <span className="mx-2 text-gray-500">/</span>
              </>
            ) : (
              <span className="text-gray-700 font-medium truncate max-w-xs">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default ProductBreadcrumb;