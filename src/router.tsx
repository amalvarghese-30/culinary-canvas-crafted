import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./routes/RootLayout";
import { AuthGuard } from "./routes/AuthGuard";
import { StaffGuard } from "./routes/StaffGuard";
import AdminLayout from "./routes/_authenticated/admin";

const Home = lazy(() => import("./routes/Home"));
const Menu = lazy(() => import("./routes/menu"));
const Gallery = lazy(() => import("./routes/gallery"));
const About = lazy(() => import("./routes/about"));
const FAQ = lazy(() => import("./routes/faq"));
const Contact = lazy(() => import("./routes/contact"));
const Reservation = lazy(() => import("./routes/reservation"));
const Auth = lazy(() => import("./routes/auth"));
const Kiosk = lazy(() => import("./routes/kiosk"));
const TablePage = lazy(() => import("./routes/t.$tableId"));
const Account = lazy(() => import("./routes/_authenticated/account"));
const Checkout = lazy(() => import("./routes/_authenticated/checkout"));
const Notifications = lazy(() => import("./routes/_authenticated/notifications"));
const OrderDetail = lazy(() => import("./routes/_authenticated/order.$id"));
const AdminDashboard = lazy(() => import("./routes/_authenticated/admin.index"));
const AdminOrders = lazy(() => import("./routes/_authenticated/admin.orders"));
const AdminReservations = lazy(() => import("./routes/_authenticated/admin.reservations"));
const AdminTables = lazy(() => import("./routes/_authenticated/admin.tables"));
const AdminKDS = lazy(() => import("./routes/_authenticated/admin.kds"));
const AdminPOS = lazy(() => import("./routes/_authenticated/admin.pos"));
const AdminMenu = lazy(() => import("./routes/_authenticated/admin.menu"));
const AdminRecipes = lazy(() => import("./routes/_authenticated/admin.recipes"));
const AdminInventory = lazy(() => import("./routes/_authenticated/admin.inventory"));
const AdminSuppliers = lazy(() => import("./routes/_authenticated/admin.suppliers"));
const AdminPromotions = lazy(() => import("./routes/_authenticated/admin.promotions"));
const AdminCampaigns = lazy(() => import("./routes/_authenticated/admin.campaigns"));
const AdminCustomers = lazy(() => import("./routes/_authenticated/admin.customers"));
const AdminBranches = lazy(() => import("./routes/_authenticated/admin.branches"));
const AdminShifts = lazy(() => import("./routes/_authenticated/admin.shifts"));
const AdminAnalytics = lazy(() => import("./routes/_authenticated/admin.analytics"));
const AdminForecast = lazy(() => import("./routes/_authenticated/admin.forecast"));
const AdminReviews = lazy(() => import("./routes/_authenticated/admin.reviews"));
const AdminAudit = lazy(() => import("./routes/_authenticated/admin.audit"));
const AdminLoyalty = lazy(() => import("./routes/_authenticated/admin.loyalty"));
const AdminSettings = lazy(() => import("./routes/_authenticated/admin.settings"));

function Lazy(Page: React.LazyExoticComponent<React.ComponentType<any>>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: Lazy(Home) },
      { path: "menu", element: Lazy(Menu) },
      { path: "gallery", element: Lazy(Gallery) },
      { path: "about", element: Lazy(About) },
      { path: "faq", element: Lazy(FAQ) },
      { path: "contact", element: Lazy(Contact) },
      { path: "reservation", element: Lazy(Reservation) },
      { path: "auth", element: Lazy(Auth) },
      { path: "kiosk", element: Lazy(Kiosk) },
      { path: "table/:tableId", element: Lazy(TablePage) },

      {
        element: <AuthGuard />,
        children: [
          { path: "account", element: Lazy(Account) },
          { path: "checkout", element: Lazy(Checkout) },
          { path: "notifications", element: Lazy(Notifications) },
          { path: "order/:id", element: Lazy(OrderDetail) },

          {
            element: <StaffGuard />,
            children: [
              {
                path: "admin",
                element: <AdminLayout />,
                children: [
                  { index: true, element: Lazy(AdminDashboard) },
                  { path: "orders", element: Lazy(AdminOrders) },
                  { path: "reservations", element: Lazy(AdminReservations) },
                  { path: "tables", element: Lazy(AdminTables) },
                  { path: "kds", element: Lazy(AdminKDS) },
                  { path: "pos", element: Lazy(AdminPOS) },
                  { path: "menu", element: Lazy(AdminMenu) },
                  { path: "recipes", element: Lazy(AdminRecipes) },
                  { path: "inventory", element: Lazy(AdminInventory) },
                  { path: "suppliers", element: Lazy(AdminSuppliers) },
                  { path: "promotions", element: Lazy(AdminPromotions) },
                  { path: "campaigns", element: Lazy(AdminCampaigns) },
                  { path: "customers", element: Lazy(AdminCustomers) },
                  { path: "branches", element: Lazy(AdminBranches) },
                  { path: "shifts", element: Lazy(AdminShifts) },
                  { path: "analytics", element: Lazy(AdminAnalytics) },
                  { path: "forecast", element: Lazy(AdminForecast) },
                  { path: "reviews", element: Lazy(AdminReviews) },
                  { path: "audit", element: Lazy(AdminAudit) },
                  { path: "loyalty", element: Lazy(AdminLoyalty) },
                  { path: "settings", element: Lazy(AdminSettings) },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
