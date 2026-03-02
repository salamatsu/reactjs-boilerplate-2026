import { Home, List, Users as UsersIcon } from "lucide-react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import BasicLayout from "../../components/layout/BasicLayout";
import { ComponentLoader } from "../../components/LoadingFallback";
import Dashboard from "../../pages/admin/Dashboard";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { Auth, UnAuth } from "../ValidateAuth";

const Login = lazy(() => import("../../pages/admin/Login"));
const ItemsPage = lazy(() => import("../../pages/admin/Items"));
const UsersPage = lazy(() => import("../../pages/admin/Users"));

const AdminRoute = () => {
  const { userData } = useAdminAuthStore();
  const userType = userData?.userType;

  const canAccess = (pageName) => {
    if (userType === "ADMIN") return true;
    if (userType === "STAFF") return ["Dashboard", "users"].includes(pageName);
    return false;
  };

  const navigations = [
    {
      route: "/dashboard",
      name: "Dashboard",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      component: (
        <Suspense fallback={<ComponentLoader />}>
          <Dashboard />
        </Suspense>
      ),
      isFilter: true,
    },
    {
      route: "/items",
      name: "items",
      label: "Items",
      icon: <List className="h-5 w-5" />,
      component: (
        <Suspense fallback={<ComponentLoader />}>
          <ItemsPage />
        </Suspense>
      ),
      isFilter: true,
    },
    {
      route: "/attendees",
      name: "attendees",
      label: "Attendees",
      icon: <UsersIcon className="h-5 w-5" />,
      component: (
        <Suspense fallback={<ComponentLoader />}>
          <UsersPage />
        </Suspense>
      ),
      isFilter: true,
    },
  ].map((page) => ({
    ...page,
    route: "/admin" + page.route,
    isShow: canAccess(page.name),
  }));

  return (
    <Routes>
      {/* Login - redirect to dashboard if already authenticated */}
      <Route
        element={
          <UnAuth store={useAdminAuthStore} redirect="/admin/dashboard" />
        }
      >
        <Route
          path="/"
          index
          element={
            <Suspense fallback={<ComponentLoader />}>
              <Login />
            </Suspense>
          }
        />
      </Route>

      {/* Protected Routes */}
      <Route element={<Auth store={useAdminAuthStore} redirect="/admin" />}>
        <Route
          element={
            <BasicLayout
              navigations={navigations.filter((page) => page.isShow)}
              store={useAdminAuthStore}
            />
          }
        >
          {navigations
            .filter((page) => page.isShow)
            .map((page) => {
              const routePath = page.route.replace("/admin/", "");
              return (
                <Route
                  key={page.route}
                  path={routePath}
                  element={page.component}
                />
              );
            })}

          {/* Default redirect to first accessible page */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  navigations.filter((page) => page.isShow)[0]?.route ||
                  "/admin/dashboard"
                }
                replace
              />
            }
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default AdminRoute;
