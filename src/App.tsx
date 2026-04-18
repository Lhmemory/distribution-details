import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./app/context/AppContext";
import { ProtectedRoute } from "./app/router/ProtectedRoute";
import { AccountPermissionsPage } from "./pages/AccountPermissionsPage";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PriceGuidePage } from "./pages/PriceGuidePage";
import { ProductPage } from "./pages/ProductPage";
import { SalesPage } from "./pages/SalesPage";
import { StorePage } from "./pages/StorePage";
import { SystemManagementPage } from "./pages/SystemManagementPage";

export function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/price-guides" element={<PriceGuidePage />} />
          <Route path="/stores" element={<StorePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/system-management" element={<SystemManagementPage />} />
          <Route path="/account-permissions" element={<AccountPermissionsPage />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
