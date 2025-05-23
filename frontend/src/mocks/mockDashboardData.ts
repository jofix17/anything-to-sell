import { VendorDashboardStats, AdminDashboardStats, Category } from "../types";

// Example categories
const categories: Record<string, Category> = {
  electronics: {
    id: "c1",
    name: "Electronics",
    description: "High-quality electronic devices.",
    slug: "electronics",
    createdAt: "2023-01-01T00:00:00",
    updatedAt: "2023-01-01T00:00:00",
    parentId: null,
  },
  furniture: {
    id: "c2",
    name: "Furniture",
    description: "Comfortable and stylish furniture.",
    slug: "furniture",
    createdAt: "2023-01-01T00:00:00",
    updatedAt: "2023-01-01T00:00:00",
    parentId: null,
  },
  foodAndBeverage: {
    id: "c3",
    name: "Food & Beverage",
    description: "Delicious food and beverages.",
    slug: "food-and-beverage",
    createdAt: "2023-01-01T00:00:00",
    updatedAt: "2023-01-01T00:00:00",
    parentId: null,
  },
};

export const mockVendorDashboardData: VendorDashboardStats = {
  totalSales: 24786.5,
  totalOrders: 186,
  pendingOrders: 12,
  totalProducts: 48,
  lowStockProducts: 5,
  averageRating: 4.7,
  monthlyRevenue: [
    { month: "Jan", revenue: 2150, orders: 18 },
    { month: "Feb", revenue: 1890, orders: 15 },
    { month: "Mar", revenue: 2300, orders: 21 },
    { month: "Apr", revenue: 2650, orders: 25 },
    { month: "May", revenue: 3100, orders: 28 },
    { month: "Jun", revenue: 2800, orders: 24 },
    { month: "Jul", revenue: 3500, orders: 32 },
    { month: "Aug", revenue: 3800, orders: 35 },
    { month: "Sep", revenue: 3200, orders: 30 },
    { month: "Oct", revenue: 2900, orders: 27 },
    { month: "Nov", revenue: 3400, orders: 31 },
    { month: "Dec", revenue: 4100, orders: 38 },
  ],
  topProducts: [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      sku: "PWH-001",
      price: 249.99,
      salesAnalytics: {
        quantitySold: 42,
        totalRevenue: 10499.58,
      },
      images: [
        {
          id: "1",
          imageUrl: "https://via.placeholder.com/150?text=Headphones",
        },
      ],
    },
    {
      id: "2",
      name: "Bluetooth Speaker",
      sku: "BS-100",
      price: 129.99,
      salesAnalytics: {
        quantitySold: 38,
        totalRevenue: 4939.62,
      },
      images: [
        {
          id: "2",
          imageUrl: "https://via.placeholder.com/150?text=Speaker",
        },
      ],
    },
    {
      id: "3",
      name: "Noise Cancelling Earbuds",
      sku: "NCE-50",
      price: 179.99,
      salesAnalytics: {
        quantitySold: 35,
        totalRevenue: 6299.65,
      },
      images: [
        {
          id: "3",
          imageUrl: "https://via.placeholder.com/150?text=Earbuds",
        },
      ],
    },
    {
      id: "4",
      name: "Wired Headphones",
      sku: "WH-200",
      price: 99.99,
      salesAnalytics: {
        quantitySold: 30,
        totalRevenue: 2999.7,
      },
      images: [
        {
          id: "4",
          imageUrl: "https://via.placeholder.com/150?text=Wired",
        },
      ],
    },
  ],
  recentOrders: [
    {
      id: "1",
      orderNumber: "ORD-7846",
      userId: "1",
      user: {
        id: "1",
        firstName: "Sarah",
        lastName: "Johnson",
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        phone: "123-456-7890",
        role: "buyer",
        isActive: true,
        createdAt: "2023-01-01T00:00:00",
        updatedAt: "2023-01-01T00:00:00",
        status: "active",
      },
      items: [],
      status: "pending",
      shippingAddress: {
        id: "1",
        userId: "1",
        fullName: "Sarah Johnson",
        addressLine1: "123 Main St",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
        phoneNumber: "123-456-7890",
        isDefault: true,
      },
      billingAddress: {
        id: "1",
        userId: "1",
        fullName: "Sarah Johnson",
        addressLine1: "123 Main St",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "USA",
        phoneNumber: "123-456-7890",
        isDefault: true,
      },
      paymentMethod: "Credit Card",
      paymentDate: "2023-07-15T10:30:00",
      paymentStatus: "paid",
      totalAmount: 429.98,
      subtotalAmount: 400.0,
      shippingCost: 29.98,
      taxAmount: 0,
      createdAt: "2023-07-15T10:30:00",
      updatedAt: "2023-07-15T10:30:00",
      vendorId: "1",
    },
    {
      id: "2",
      orderNumber: "ORD-7845",
      userId: "2",
      user: {
        id: "2",
        firstName: "Michael",
        lastName: "Williams",
        name: "Michael Williams",
        email: "michael.williams@example.com",
        phone: "123-456-7890",
        role: "buyer",
        isActive: true,
        createdAt: "2023-01-01T00:00:00",
        updatedAt: "2023-01-01T00:00:00",
        status: "active",
      },
      items: [],
      status: "processing",
      shippingAddress: {
        id: "2",
        userId: "2",
        fullName: "Michael Williams",
        addressLine1: "456 Elm St",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90001",
        country: "USA",
        phoneNumber: "123-456-7890",
        isDefault: true,
      },
      billingAddress: {
        id: "2",
        userId: "2",
        fullName: "Michael Williams",
        addressLine1: "456 Elm St",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90001",
        country: "USA",
        phoneNumber: "123-456-7890",
        isDefault: true,
      },
      paymentMethod: "PayPal",
      paymentDate: "2023-07-14T15:45:00",
      paymentStatus: "paid",
      totalAmount: 179.99,
      subtotalAmount: 160.0,
      shippingCost: 19.99,
      taxAmount: 0,
      createdAt: "2023-07-14T15:45:00",
      updatedAt: "2023-07-14T15:45:00",
      vendorId: "1",
    },
    // ...remaining orders...
  ],
};

export const mockAdminDashboardData: AdminDashboardStats = {
  totalRevenue: 127845.75,
  totalOrders: 1568,
  totalUsers: 3742,
  totalProducts: 834,
  pendingApprovals: 12,
  revenueByMonth: [
    { month: "Jan", revenue: 8500 },
    { month: "Feb", revenue: 9200 },
    { month: "Mar", revenue: 10500 },
    { month: "Apr", revenue: 9800 },
    { month: "May", revenue: 11300 },
    { month: "Jun", revenue: 12100 },
    { month: "Jul", revenue: 14500 },
    { month: "Aug", revenue: 13900 },
    { month: "Sep", revenue: 12700 },
    { month: "Oct", revenue: 11900 },
    { month: "Nov", revenue: 13200 },
    { month: "Dec", revenue: 15700 },
  ],
  ordersByStatus: [
    { status: "Pending", count: 143 },
    { status: "Processing", count: 254 },
    { status: "Shipped", count: 342 },
    { status: "Delivered", count: 798 },
    { status: "Cancelled", count: 31 },
  ],
  recentUsers: [
    {
      id: "u1",
      name: "Emma Wilson",
      email: "emma.wilson@example.com",
      role: "buyer",
      createdAt: "2023-07-12T14:32:00",
      avatarUrl: "https://via.placeholder.com/40",
      status: "active",
    },
    {
      id: "u2",
      name: "James Rodriguez",
      email: "james.r@example.com",
      role: "vendor",
      createdAt: "2023-07-10T09:45:00",
      avatarUrl: "https://via.placeholder.com/40",
      status: "active",
    },
    {
      id: "u3",
      name: "Sophia Chen",
      email: "sophia.chen@example.com",
      role: "buyer",
      createdAt: "2023-07-09T16:20:00",
      status: "inactive",
    },
    {
      id: "u4",
      name: "Michael Taylor",
      email: "michael.t@example.com",
      role: "vendor",
      createdAt: "2023-07-08T11:15:00",
      avatarUrl: "https://via.placeholder.com/40",
      status: "active",
    },
    {
      id: "u5",
      name: "Olivia Johnson",
      email: "olivia.j@example.com",
      role: "buyer",
      createdAt: "2023-07-07T13:40:00",
      status: "suspended",
    },
  ],
  pendingProducts: [
    {
      id: "p1",
      name: "Premium Bluetooth Speaker",
      category: categories.electronics,
      vendor: {
        id: "v1",
        name: "TechGiant",
        email: "",
        firstName: "",
        lastName: "",
        role: "vendor",
        phone: "",
        isActive: false,
        createdAt: "",
        updatedAt: "",
        status: "active",
      },
      price: 129.99,
      createdAt: "2023-07-14T08:30:00",
      images: [
        {
          id: "img1",
          imageUrl: "https://via.placeholder.com/150?text=Speaker",
        },
      ],
    },
    {
      id: "p2",
      name: "Ergonomic Office Chair",
      category: categories.furniture,
      vendor: {
        id: "v2",
        name: "ComfortLiving",
        email: "",
        firstName: "",
        lastName: "",
        role: "vendor",
        phone: "",
        isActive: false,
        createdAt: "",
        updatedAt: "",
        status: "active",
      },
      price: 249.99,
      createdAt: "2023-07-13T14:20:00",
      images: [
        {
          id: "img2",
          imageUrl: "https://via.placeholder.com/150?text=Chair",
        },
      ],
    },
    {
      id: "p3",
      name: "Smart Fitness Watch",
      category: categories.electronics,
      vendor: {
        id: "v3",
        name: "TechWearables",
        email: "",
        firstName: "",
        lastName: "",
        role: "vendor",
        phone: "",
        isActive: false,
        createdAt: "",
        updatedAt: "",
        status: "active",
      },
      price: 189.99,
      createdAt: "2023-07-13T10:15:00",
      images: [
        {
          id: "img3",
          imageUrl: "https://via.placeholder.com/150?text=Watch",
        },
      ],
    },
    {
      id: "p4",
      name: "Artisanal Coffee Beans",
      category: categories.foodAndBeverage,
      vendor: {
        id: "v4",
        name: "Brew Masters",
        email: "",
        firstName: "",
        lastName: "",
        role: "vendor",
        phone: "",
        isActive: false,
        createdAt: "",
        updatedAt: "",
        status: "active",
      },
      price: 24.99,
      createdAt: "2023-07-12T16:40:00",
      images: [
        {
          id: "img4",
          imageUrl: "https://via.placeholder.com/150?text=Coffee",
        },
      ],
    },
  ],
};
