import React, { useState, useEffect } from "react";
import { getColorClasses } from "../../utils/misc";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";

interface SearchProps {
  isScrolled?: boolean;
  expanded?: boolean;
  placeholder?: string;
  value?: URLSearchParams;
  onChange?: (newQuery: string) => void;
  className?: string;
  fullWidth?: boolean;
}

// Define form values interface
interface SearchFormValues {
  searchQuery: string;
}

// Validation schema for search form
const SearchSchema = Yup.object().shape({
  searchQuery: Yup.string().trim(),
});

const Search: React.FC<SearchProps> = ({
  isScrolled,
  expanded,
  placeholder,
  value,
  onChange,
  className = "",
  fullWidth = false
}) => {
  // If expanded is true, search will always be open
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(Boolean(expanded));
  const navigate = useNavigate();

  // Extract the query from URL params if provided
  const queryFromParams = value?.get("query") || "";
  
  // Initial form values - use query from URL params if available
  const initialValues: SearchFormValues = {
    searchQuery: queryFromParams || "",
  };

  // Reference to access Formik methods outside submit handler
  const formikRef = React.useRef<FormikProps<SearchFormValues>>(null);

  // Update search query when URL params change
  useEffect(() => {
    if (value && formikRef.current && queryFromParams !== formikRef.current.values.searchQuery) {
      // This is needed to keep the form in sync with URL params
      formikRef.current.setFieldValue("searchQuery", queryFromParams);
    }
  }, [queryFromParams, value]);

  // Handle form submission
  const handleSubmit = (
    values: SearchFormValues,
    { resetForm }: FormikHelpers<SearchFormValues>
  ) => {
    if (values.searchQuery.trim()) {
      // If onChange handler is provided, use it (for filtering in ProductsPage)
      if (onChange) {
        onChange(values.searchQuery);
      } else {
        // Otherwise navigate to products page with search query (for header search)
        navigate(`/products?query=${encodeURIComponent(values.searchQuery)}`);
        resetForm();
      }

      // Only close the search if not permanently expanded
      if (!expanded) {
        setIsSearchOpen(false);
      }
    }
  };

  // Toggle search visibility (only if not permanently expanded)
  const toggleSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only toggle if not permanently expanded
    if (!expanded) {
      setIsSearchOpen(!isSearchOpen);
    }
    // If expanded, clicking does nothing as the search should stay open
  };

  return (
    <div className={`relative ${className}`}>
      <Formik
        initialValues={initialValues}
        validationSchema={SearchSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        innerRef={formikRef}
      >
        {() => (
          <Form className={`flex items-center ${fullWidth ? "w-full" : ""}`}>
            <div
              className={`flex items-center transition-all duration-300 ${
                expanded || isSearchOpen ? (fullWidth ? "w-full" : "w-64") : "w-10"
              } ${!fullWidth && !expanded ? "absolute right-0" : ""}`}
            >
              <button
                onClick={toggleSearch}
                className={`p-2 rounded-md ${getColorClasses(isScrolled)} ${
                  expanded || isSearchOpen ? "absolute left-0 z-10" : ""
                }`}
                aria-label="Search"
                type="button"
              >
                <SearchIcon className="w-5 h-5" />
              </button>

              {/* Always show input when expanded=true, otherwise show based on isSearchOpen state */}
              {(expanded || isSearchOpen) && (
                <Field
                  type="text"
                  name="searchQuery"
                  placeholder={placeholder || "Search for products..."}
                  className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md shadow-none${fullWidth ? " h-10" : ""}`}
                  autoFocus={!expanded}
                  // Only close on blur if not permanently expanded
                  onBlur={() => {
                    if (!expanded) {
                      setIsSearchOpen(false);
                    }
                  }}
                />
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Search;