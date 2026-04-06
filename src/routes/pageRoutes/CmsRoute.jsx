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

import { Megaphone } from "lucide-react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import BasicLayout from "../../components/layout/BasicLayout";
import { ComponentLoader } from "../../components/LoadingFallback";
import { Auth, UnAuth } from "../ValidateAuth";
import { useAdminAuthStore, useCurrentActiveUserToken } from "../../store/useAdminAuthStore";

const Login             = lazy(() => import("../../pages/admin/Login"));
const CampaignManager   = lazy(() => import("../../pages/admin/CampaignManager"));

// Combined store passed to BasicLayout — merges userData from admin store
// with a reset that clears both auth stores.
const useCmsStore = () => {
  const { userData, reset: resetAdmin } = useAdminAuthStore();
  const { reset: resetActiveUser } = useCurrentActiveUserToken();
  return {
    userData,
    reset: () => {
      resetAdmin();
      resetActiveUser();
    },
  };
};

const CmsRoute = () => {
  const navigations = [
    {
      route: "/campaigns",
      name: "campaigns",
      label: "Events",
      icon: <Megaphone className="h-5 w-5" />,
      component: (
        <Suspense fallback={<ComponentLoader />}>
          <CampaignManager />
        </Suspense>
      ),
    },
  ].map((page) => ({ ...page, route: "/admin" + page.route }));

  return (
    <Routes>
      {/* Login — unauthenticated only; redirects to CMS if already logged in */}
      <Route element={<UnAuth store={useAdminAuthStore} redirect="/admin/campaigns" />}>
        <Route index element={<Suspense fallback={<ComponentLoader />}><Login /></Suspense>} />
      </Route>

      {/* CMS pages — authenticated only; redirects to login if not */}
      <Route element={<Auth store={useAdminAuthStore} redirect="/admin" />}>
        <Route element={<BasicLayout navigations={navigations} store={useCmsStore} />}>
          {navigations.map((page) => {
            const routePath = page.route.replace("/admin/", "");
            return (
              <Route key={page.route} path={routePath} element={page.component} />
            );
          })}

          {/* Catch-all → first CMS page */}
          <Route
            path="*"
            element={<Navigate to={navigations[0]?.route || "/admin/campaigns"} replace />}
          />
        </Route>
      </Route>
    </Routes>
  );
};

export default CmsRoute;
