import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import Shop from "./pages/Shop";
import CategoryPage from "./pages/CategoryPage";
import BrandsPage from "./pages/BrandsPage";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";
import Wishlist from "./pages/Wishlist";
import Addresses from "./pages/Addresses";
import AdminLayout from "./pages/admin/Layout";
import DashboardPage from "./pages/admin/Dashboard";
import ProductsPage from "./pages/admin/Products";
import CategoriesPage from "./pages/admin/Categories";
import BrandsAdminPage from "./pages/admin/Brands";
import OrdersPage from "./pages/admin/Orders";
import UsersPage from "./pages/admin/Users";
import SettingsPage from "./pages/admin/Settings";
import SocialLinksPage from "./pages/admin/SocialLinks";
import ContactInfoPage from "./pages/admin/ContactInfo";
import AuthPage from "./pages/Auth";
import AdminLogin from "./pages/admin/AdminLogin";
import ProductForm from "./pages/admin/ProductForm";
import PincodesPage from "./pages/admin/Pincodes";
import ReturnRequestsPage from "./pages/admin/ReturnRequests";
import VendorsListPage from "./pages/admin/vendors/VendorsList";
import CreateVendorPage from "./pages/admin/vendors/CreateVendor";
import WithdrawalsListPage from "./pages/admin/vendors/WithdrawalsList";
import AdminVendorProductsPage from "./pages/admin/vendors/VendorProductsPage";
import EyewearAttributesPage from "./pages/admin/EyewearAttributes";
import NavigationManagerPage from "./pages/admin/NavigationManager";
import GalleryPage from "./pages/admin/Gallery";
import AdminSliders from "./pages/admin/AdminSliders";
import AdminStores from "./pages/admin/Stores";
import AppointmentsPage from "./pages/admin/Appointments";
import StoreLocator from "./pages/StoreLocator";
import VendorStores from "./pages/vendor/Stores";
import VendorAppointmentsPage from "./pages/vendor/Appointments";
import AdminLensManagerPage from "./pages/admin/LensManager";
import FAQPage from "./pages/FAQ";
import AgentCallingButton from "./components/layout/AgentCallingButton";

import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/layout/ScrollToTop";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import VendorLayout from "./pages/vendor/VendorLayout";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProductsPage from "./pages/vendor/Products";
import VendorLensManagerPage from "./pages/vendor/VendorLensManager";
import VendorLogin from "./pages/vendor/VendorLogin";
import BulkProductsPage from "./pages/admin/BulkProducts";
import BulkProductForm from "./pages/admin/BulkProductForm";
import BulkMarketplacePage from "./pages/vendor/BulkMarketplace";
import WholesaleOrdersPage from "./pages/admin/BulkOrders";
import ProductInquiriesPage from "./pages/admin/Inquiries";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorPurchases from "./pages/vendor/VendorPurchases";
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorPayouts from "./pages/vendor/VendorPayouts";

const queryClient = new QueryClient();

const AppContent = () => {
  const { settings, loading } = useSettings();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (settings.maintenanceMode && !isAdminRoute) {
    return <Maintenance />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/store-locator" element={<StoreLocator />} />
      <Route path="/brands" element={<BrandsPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />

      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/vendor/login" element={<VendorLogin />} />

      {/* Vendor Routes */}
      <Route path="/vendor/*" element={<VendorLayout />}>
        <Route index element={<VendorDashboard />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorProductsPage />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="lens-manager" element={<VendorLensManagerPage />} />
        <Route path="stores" element={<VendorStores />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="purchases" element={<VendorPurchases />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="payouts" element={<VendorPayouts />} />
        <Route path="bulk-marketplace" element={<BulkMarketplacePage />} />
        <Route path="appointments" element={<VendorAppointmentsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="brands" element={<BrandsAdminPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="sliders" element={<AdminSliders />} />

        <Route path="social-links" element={<SocialLinksPage />} />
        <Route path="contact-info" element={<ContactInfoPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="pincodes" element={<PincodesPage />} />
        <Route path="return-requests" element={<ReturnRequestsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="navigation-manager" element={<NavigationManagerPage />} />
        <Route path="vendors" element={<VendorsListPage />} />
        <Route path="vendors/create" element={<CreateVendorPage />} />
        <Route path="vendors/withdraws" element={<WithdrawalsListPage />} />
        <Route path="vendor-products" element={<AdminVendorProductsPage />} />
        <Route path="eyewear-attributes" element={<EyewearAttributesPage />} />
        <Route path="bulk-products" element={<BulkProductsPage />} />
        <Route path="bulk-products/new" element={<BulkProductForm />} />
        <Route path="bulk-products/:id" element={<BulkProductForm />} />
        <Route path="wholesale-orders" element={<WholesaleOrdersPage />} />
        <Route path="product-inquiries" element={<ProductInquiriesPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="stores" element={<AdminStores />} />
        <Route path="lens-manager" element={<AdminLensManagerPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />

        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <WhatsAppButton />
      <AgentCallingButton />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <WishlistProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </WishlistProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
