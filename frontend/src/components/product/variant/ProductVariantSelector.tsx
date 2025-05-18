import { useState, useEffect, useRef } from "react";
import {
  Variant,
  VariantOptions,
  VariantProperty,
} from "../../../types/product";

interface ProductVariantSelectorProps {
  variants: Variant[];
  variantOptions: VariantOptions;
  onVariantChange: (variant: Variant) => void;
  initialVariant?: Variant;
}

const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  variants,
  variantOptions,
  onVariantChange,
  initialVariant,
}) => {
  const [selectedProperties, setSelectedProperties] = useState<{
    [key: string]: string;
  }>({});
  const [currentVariant, setCurrentVariant] = useState<Variant | null>(
    initialVariant || null
  );
  const initializedRef = useRef(false);

  // Initialize with default variant or first variant's properties
  useEffect(() => {
    if (variants.length > 0 && !initializedRef.current) {
      const defaultVariant =
        initialVariant || variants.find((v) => v.isDefault) || variants[0];
      initializedRef.current = true;

      // Set the initial selected properties
      setSelectedProperties(defaultVariant.properties);
      setCurrentVariant(defaultVariant);

      // Notify parent component
      onVariantChange(defaultVariant);
    }
  }, [variants, initialVariant, onVariantChange]);

  // Find the best matching variant based on selected properties
  const findMatchingVariant = (properties: {
    [key: string]: string;
  }): Variant | null => {
    // First try to find an exact match for all properties
    const exactMatch = variants.find((variant) => {
      return Object.keys(properties).every(
        (key) => variant.properties[key] === properties[key]
      );
    });

    if (exactMatch) return exactMatch;

    // If no exact match, find the best partial match
    // Sort variants by number of matching properties (descending)
    const sortedVariants = [...variants].sort((a, b) => {
      const aMatches = Object.keys(properties).filter(
        (key) => a.properties[key] === properties[key]
      ).length;

      const bMatches = Object.keys(properties).filter(
        (key) => b.properties[key] === properties[key]
      ).length;

      return bMatches - aMatches;
    });

    return sortedVariants[0] || null;
  };

  // Handle property selection change
  const handlePropertyChange = (propertyName: string, value: string) => {
    console.log(`Changing ${propertyName} to ${value}`);

    const updatedProperties = {
      ...selectedProperties,
      [propertyName]: value,
    };

    setSelectedProperties(updatedProperties);

    // Find the best matching variant
    const matchingVariant = findMatchingVariant(updatedProperties);

    if (matchingVariant) {
      console.log(`Found matching variant: ${matchingVariant.id}`);
      setCurrentVariant(matchingVariant);
      onVariantChange(matchingVariant);
    }
  };

  // Get available values for a property based on currently selected properties
  const getAvailableValues = (propertyName: string): string[] => {
    // For the current property, find all unique values from variants where the other selected properties match
    const otherProperties = { ...selectedProperties };
    delete otherProperties[propertyName];

    const validVariants = variants.filter((variant) => {
      return Object.keys(otherProperties).every(
        (key) =>
          !otherProperties[key] ||
          variant.properties[key] === otherProperties[key]
      );
    });

    const availableValues = validVariants
      .map((v) => v.properties[propertyName])
      .filter(Boolean) // Remove undefined/null values
      .filter((value, index, self) => self.indexOf(value) === index); // Get unique values

    return availableValues;
  };

  // Check if a specific property value is available based on other selections
  const isValueAvailable = (propertyName: string, value: string): boolean => {
    const availableValues = getAvailableValues(propertyName);
    return availableValues.includes(value);
  };

  // Check if a specific property value is in stock
  const isValueInStock = (propertyName: string, value: string): boolean => {
    const otherProperties = { ...selectedProperties };
    delete otherProperties[propertyName];

    const matchingVariants = variants.filter((variant) => {
      return (
        variant.properties[propertyName] === value &&
        Object.keys(otherProperties).every(
          (key) =>
            !otherProperties[key] ||
            variant.properties[key] === otherProperties[key]
        )
      );
    });

    return matchingVariants.some((v) => v.inStock);
  };

  // Render color selector
  const renderColorSelector = (
    property: VariantProperty,
    propertyName: string
  ) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {property.displayName}
        </label>
        <div className="flex flex-wrap gap-2">
          {property.values.map((colorValue) => {
            const isAvailable = isValueAvailable(propertyName, colorValue);
            const isInStock = isValueInStock(propertyName, colorValue);
            const isSelected = selectedProperties[propertyName] === colorValue;

            return (
              <button
                key={colorValue}
                type="button"
                disabled={!isAvailable || !isInStock}
                onClick={() => handlePropertyChange(propertyName, colorValue)}
                className={`w-10 h-10 rounded-full border-2 relative ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-blue-500"
                    : "ring-1 ring-gray-200"
                } ${
                  !isAvailable || !isInStock
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                style={{
                  backgroundColor: colorValue,
                  borderColor:
                    colorValue === "#FFFFFF" || colorValue === "#FFF"
                      ? "#e5e7eb"
                      : colorValue,
                }}
                aria-label={`Color: ${colorValue}`}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className={`w-4 h-4 ${
                        isLightColor(colorValue)
                          ? "text-gray-800"
                          : "text-white"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render select/dropdown selector
  const renderSelectSelector = (
    property: VariantProperty,
    propertyName: string
  ) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {property.displayName}
        </label>
        <select
          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedProperties[propertyName] || ""}
          onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
        >
          <option value="" disabled>
            Select {property.displayName}
          </option>
          {property.values.map((value) => {
            const isAvailable = isValueAvailable(propertyName, value);
            const isInStock = isValueInStock(propertyName, value);

            return (
              <option
                key={value}
                value={value}
                disabled={!isAvailable || !isInStock}
              >
                {value} {!isInStock && "(Out of Stock)"}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  // Helper function to determine if a color is light
  const isLightColor = (color: string): boolean => {
    // For hex colors
    if (color.startsWith("#")) {
      const hex = color.substring(1);
      const rgb = parseInt(hex, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;

      // Calculate luminance (perceived brightness)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance > 128;
    }
    return false;
  };

  // Get available properties that have values
  const availableProperties = Object.keys(variantOptions).filter(
    (key) => variantOptions[key].values.length > 0
  );

  if (availableProperties.length === 0 || variants.length === 0) {
    return null; // No variants to display
  }

  return (
    <div className="space-y-4">
      {availableProperties.map((propertyName) => {
        const property = variantOptions[propertyName];

        // Render different selector based on property type
        switch (property.propertyType) {
          case "color":
            return (
              <div key={propertyName}>
                {renderColorSelector(property, propertyName)}
              </div>
            );
          case "select":
          default:
            return (
              <div key={propertyName}>
                {renderSelectSelector(property, propertyName)}
              </div>
            );
        }
      })}

      {/* Display selected variant info if needed */}
      {currentVariant && (
        <div className="text-sm text-gray-500 mt-2">
          <p>Selected: {currentVariant.displayTitle}</p>
        </div>
      )}
    </div>
  );
};

export default ProductVariantSelector;
