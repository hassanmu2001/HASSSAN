import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/hooks/use-cart";
import { CountryProvider } from "@/hooks/use-country";
import { CompareProvider } from "@/hooks/use-compare";
import CountryPickerOverlay from "@/components/CountryPickerOverlay";
import CompareBar from "@/components/CompareBar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CategoryPage from "./pages/CategoryPage";
import ProviderProfile from "./pages/ProviderProfile";
import Dashboard from "./pages/Dashboard";
import DashboardServices from "./pages/DashboardServices";
import DashboardServiceManage from "./pages/DashboardServiceManage";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardBookings from "./pages/DashboardBookings";
import DashboardPortfolio from "./pages/DashboardPortfolio";
import ServiceDetail from "./pages/ServiceDetail";
import Messages from "./pages/Messages";
import Cart from "./pages/Cart";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminServices from "./pages/AdminServices";
import AdminVerification from "./pages/AdminVerification";
import AdminCategories from "./pages/AdminCategories";
import AdminReviews from "./pages/AdminReviews";
import AdminMessages from "./pages/AdminMessages";
import Notifications from "./pages/Notifications";
import WeddingList from "./pages/WeddingList";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardCoupons from "./pages/DashboardCoupons";
import DashboardStories from "./pages/DashboardStories";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <CountryProvider>
        <CompareProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CountryPickerOverlay />
              <CompareBar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/provider/:providerId" element={<ProviderProfile />} />
                <Route path="/service/:serviceId" element={<ServiceDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/services" element={<DashboardServices />} />
                <Route path="/dashboard/services/:serviceId" element={<DashboardServiceManage />} />
                <Route path="/dashboard/bookings" element={<DashboardBookings />} />
                <Route path="/dashboard/portfolio" element={<DashboardPortfolio />} />
                <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
                <Route path="/dashboard/coupons" element={<DashboardCoupons />} />
                <Route path="/dashboard/stories" element={<DashboardStories />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/wedding-list" element={<WeddingList />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/services" element={<AdminServices />} />
                <Route path="/admin/verification" element={<AdminVerification />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CompareProvider>
      </CountryProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
