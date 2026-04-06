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

import { Trophy, Layers, Megaphone } from "lucide-react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import BasicLayout from "../../components/layout/BasicLayout";
import { ComponentLoader } from "../../components/LoadingFallback";

const RouletteprizesCMS = lazy(() => import("../../pages/admin/RouletteprizesCMS"));
const PrizePoolConfig   = lazy(() => import("../../pages/admin/PrizePoolConfig"));
const CampaignManager   = lazy(() => import("../../pages/admin/CampaignManager"));

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
  ].map((page) => ({ ...page, route: "/admin" + page.route }));

  return (
    <Routes>
      {/* Redirect /admin root to first page */}
      <Route
        path="/"
        index
        element={<Navigate to={navigations[0]?.route || "/admin/campaigns"} replace />}
      />

      {/* CMS pages — no auth required */}
      <Route element={<BasicLayout navigations={navigations} />}>
        {navigations.map((page) => {
          const routePath = page.route.replace("/admin/", "");
          return (
            <Route key={page.route} path={routePath} element={page.component} />
          );
        })}

        {/* Catch-all → first page */}
        <Route
          path="*"
          element={<Navigate to={navigations[0]?.route || "/admin/campaigns"} replace />}
        />
      </Route>
    </Routes>
  );
};

export default CmsRoute;
