import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';


interface Product {
  id: string;
  name: string;
  category: string;
  vendor: {
    id: string;
    name: string;
  };
  price: number;
  submittedDate: string;
  image: string;
}

interface ProductApprovalsListProps {
  products: Product[];
}

const ProductApprovalsList: React.FC<ProductApprovalsListProps> = ({ products }) => {
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Function to handle product approval
  const handleApprove = (productId: string) => {
    // In a real app, this would call an API
    console.log(`Approving product: ${productId}`);
    // After successful API call, you'd refresh the product list
  };

  // Function to handle product rejection
  const handleReject = (productId: string) => {
    // In a real app, this would call an API
    console.log(`Rejecting product: ${productId}`);
    // After successful API call, you'd refresh the product list
  };

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/admin/products/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                    {product.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 gap-x-2">
                    <span>{product.category}</span>
                    <span>•</span>
                    <span>${product.price.toFixed(2)}</span>
                    <span>•</span>
                    <span>Submitted: {formatDate(product.submittedDate)}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-gray-500">Vendor: </span>
                    <Link to={`/admin/users/${product.vendor.id}`} className="text-blue-600 hover:text-blue-800">
                      {product.vendor.name}
                    </Link>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleApprove(product.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleReject(product.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">No products awaiting approval</p>
        </div>
      )}
    </div>
  );
};

export default ProductApprovalsList;
