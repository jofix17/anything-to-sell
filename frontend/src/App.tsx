import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryProvider } from "./context/QueryContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Layout components
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import VendorLayout from "./components/layout/VendorLayout";

// Public pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

// Buyer pages
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrdersDetailPage";
import WishlistPage from "./pages/WishlistPage";
import SupportPage from "./pages/SupportPage";

// Vendor pages
import VendorDashboardPage from "./pages/vendor/VendorDashboardPage";
import VendorProductsPage from "./pages/vendor/ProductsPage";
import VendorAddProductPage from "./pages/vendor/AddProductPage";
import VendorEditProductPage from "./pages/vendor/EditProductPage";
import VendorOrdersPage from "./pages/vendor/OrdersPage";
import VendorOrderDetailPage from "./pages/vendor/OrderDetailPage";
import VendorSettingsPage from "./pages/vendor/SettingsPage";
import VendorAnalyticsPage from "./pages/vendor/AnalyticsPage";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import AdminUserDetailPage from "./pages/admin/UserDetailPage";
import AdminProductsPage from "./pages/admin/ProductsPage";
import AdminProductDetailPage from "./pages/admin/ProductDetailPage";
import AdminCategoriesPage from "./pages/admin/CategoriesPage";
import AdminOrdersPage from "./pages/admin/OrdersPage";
import AdminOrderDetailPage from "./pages/admin/OrderDetailPage";
import AdminDiscountsPage from "./pages/admin/DiscountsPage";
import AdminSettingsPage from "./pages/admin/SettingsPage";

// Error pages
import NotFoundPage from "./pages/NotFoundPage";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemesContext";
import NotificationToast from "./components/common/NotificationToast";

// Protected route wrapper
interface ProtectedRouteProps {
  element: React.ReactNode;
  requiredRole?: "admin" | "vendor" | "buyer";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading } = useAuthContext();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for required role
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user role
    if (user?.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === "vendor") {
      return <Navigate to="/vendor/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{element}</>;
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <Router>
        <NotificationProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <NotificationToast />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="products" element={<ProductsPage />} />
                      <Route
                        path="products/:id"
                        element={<ProductDetailPage />}
                      />
                      <Route path="about" element={<AboutPage />} />
                      <Route path="contact" element={<ContactPage />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />
                      <Route
                        path="forgot-password"
                        element={<ForgotPasswordPage />}
                      />
                      <Route
                        path="reset-password"
                        element={<ResetPasswordPage />}
                      />
                    </Route>

                    {/* Buyer routes */}
                    <Route path="/" element={<MainLayout />}>
                      <Route
                        path="profile"
                        element={<ProtectedRoute element={<ProfilePage />} />}
                      />
                      <Route path="cart" element={<CartPage />} />
                      <Route
                        path="checkout"
                        element={<ProtectedRoute element={<CheckoutPage />} />}
                      />
                      <Route
                        path="orders"
                        element={<ProtectedRoute element={<OrdersPage />} />}
                      />
                      <Route
                        path="orders/:id"
                        element={
                          <ProtectedRoute element={<OrderDetailPage />} />
                        }
                      />
                      <Route
                        path="wishlist"
                        element={<ProtectedRoute element={<WishlistPage />} />}
                      />
                      <Route
                        path="support"
                        element={<ProtectedRoute element={<SupportPage />} />}
                      />
                    </Route>

                    {/* Vendor routes */}
                    <Route
                      path="/vendor"
                      element={
                        <ProtectedRoute
                          element={<VendorLayout />}
                          requiredRole="vendor"
                        />
                      }
                    >
                      <Route
                        path="dashboard"
                        element={<VendorDashboardPage />}
                      />
                      <Route path="products" element={<VendorProductsPage />} />
                      <Route
                        path="products/add"
                        element={<VendorAddProductPage />}
                      />
                      <Route
                        path="products/edit/:id"
                        element={<VendorEditProductPage />}
                      />
                      <Route path="orders" element={<VendorOrdersPage />} />
                      <Route
                        path="orders/:id"
                        element={<VendorOrderDetailPage />}
                      />
                      <Route path="settings" element={<VendorSettingsPage />} />
                      <Route
                        path="analytics"
                        element={<VendorAnalyticsPage />}
                      />
                    </Route>

                    {/* Admin routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute
                          element={<AdminLayout />}
                          requiredRole="admin"
                        />
                      }
                    >
                      <Route
                        path="dashboard"
                        element={<AdminDashboardPage />}
                      />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route
                        path="users/:id"
                        element={<AdminUserDetailPage />}
                      />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route
                        path="products/:id"
                        element={<AdminProductDetailPage />}
                      />
                      <Route
                        path="categories"
                        element={<AdminCategoriesPage />}
                      />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route
                        path="orders/:id"
                        element={<AdminOrderDetailPage />}
                      />
                      <Route
                        path="discounts"
                        element={<AdminDiscountsPage />}
                      />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>

                    {/* Catch-all route for 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </NotificationProvider>
      </Router>
    </QueryProvider>
  );
};

export default App;
