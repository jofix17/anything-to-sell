export const getColorClasses = (isScrolled?: boolean) => {
  return isScrolled
    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    : "text-primary-600 hover:text-gray-600 hover:bg-gray-100";
};
