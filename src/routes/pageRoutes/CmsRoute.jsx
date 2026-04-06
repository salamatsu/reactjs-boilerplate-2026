// ============================================
// SCAN2WIN — Admin CMS Route
// Worldbex Events "Scan to Win" Platform
//
// Surfaces under /admin/*:
//   /admin              → Login (unauthenticated only)
//   /admin/prizes       → Roulette Prize CMS (CRUD)
//   /admin/pool         → Prize Pool Config (isPool toggles)
//
// Access: ADMIN role can access all pages.
//         STAFF role can access Prizes only.
// ============================================

import { Trophy, Layers } from "lucide-react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import BasicLayout from "../../components/layout/BasicLayout";
import { ComponentLoader } from "../../components/LoadingFallback";
import { useAdminAuthStore } from "../../store/useAdminAuthStore";
import { Auth, UnAuth } from "../ValidateAuth";

const Login            = lazy(() => import("../../pages/admin/Login"));
const RouletteprizesCMS = lazy(() => import("../../pages/admin/RouletteprizesCMS"));
const PrizePoolConfig  = lazy(() => import("../../pages/admin/PrizePoolConfig"));

const CmsRoute = () => {
  const { userData } = useAdminAuthStore();
  const userType = userData?.userType;

  // ADMIN sees all CMS pages; STAFF sees Prizes only
  const canAccess = (pageName) => {
    if (userType === "ADMIN") return true;
    if (userType === "STAFF") return pageName === "prizes";
    return false;
  };

  const navigations = [
    {
      route: "/prizes",
      name: "prizes",
      label: "Roulette Prizes",
      icon: <Trophy className="h-5 w-5" />,
      component: (
        <Suspense fallback={<ComponentLoader />}>
          <RouletteprizesCMS />
        </Suspense>
      ),
    },
    {
      route: "/pool",
      name: "pool",
      label: "Prize Pool Config",
      icon: <Layers className="h-5 w-5" />,
      component: (
        <Suspense fallback={<ComponentLoader />}>
          <PrizePoolConfig />
        </Suspense>
      ),
    },
  ].map((page) => ({
    ...page,
    route: "/admin" + page.route,
    isShow: canAccess(page.name),
  }));

  return (
    <Routes>
      {/* Login — redirect to prizes dashboard if already authenticated */}
      <Route
        element={
          <UnAuth store={useAdminAuthStore} redirect="/admin/prizes" />
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

      {/* Protected CMS Routes */}
      <Route element={<Auth store={useAdminAuthStore} redirect="/admin" />}>
        <Route
          element={
            <BasicLayout
              navigations={navigations.filter((p) => p.isShow)}
              store={useAdminAuthStore}
            />
          }
        >
          {navigations
            .filter((p) => p.isShow)
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

          {/* Redirect /admin/* to first accessible page */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  navigations.filter((p) => p.isShow)[0]?.route ||
                  "/admin/prizes"
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

export default CmsRoute;
