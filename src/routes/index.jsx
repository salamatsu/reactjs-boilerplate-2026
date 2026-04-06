// ============================================
// SCAN2WIN — Root Router
// Worldbex Events "Scan to Win" Platform
//
// Four public surfaces + admin CMS:
//   /:eventTag          → Visitor Web App (e.g. /mias)
//   /redeem             → Redeem Portal (prize booth staff)
//   /rouletteprizes     → Roulette CMS (admin)
//   /rouletteprizespool → Prize Pool Config (admin — secret)
//   /admin              → Admin Login
//   *                   → 404
// ============================================

import { Suspense, lazy } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  ScrollRestoration,
} from "react-router";
import LoadingFallback from "../components/LoadingFallback";

// Lazy-load all surfaces for code splitting
const VisitorApp     = lazy(() => import("../pages/visitor/VisitorApp"));
const RedeemPortal   = lazy(() => import("../pages/redeem/RedeemPortal"));
const CmsRoute       = lazy(() => import("./pageRoutes/CmsRoute"));
const NotFound       = lazy(() => import("../pages/NotFound"));

// Thin layout wrapper that restores scroll position on navigation
const Layout = ({ children }) => (
  <>
    <ScrollRestoration />
    {children}
  </>
);

const RootRoutes = () => {
  const router = createBrowserRouter(
    [
      // ─── Visitor Web App (/mias, /wofex, etc.) ───────────────────────────
      {
        path: "/:eventTag",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <VisitorApp />
            </Suspense>
          </Layout>
        ),
      },

      // ─── Redeem Portal (prize booth staff) ───────────────────────────────
      {
        path: "/redeem",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <RedeemPortal />
            </Suspense>
          </Layout>
        ),
      },

      // ─── Admin CMS (Roulette prizes + pool config + login) ───────────────
      {
        path: "/admin/*",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <CmsRoute />
            </Suspense>
          </Layout>
        ),
      },

      // ─── 404 catch-all ────────────────────────────────────────────────────
      {
        path: "*",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <NotFound />
            </Suspense>
          </Layout>
        ),
      },
    ],
    {
      future: { v7_startTransition: true },
    }
  );

  return <RouterProvider router={router} />;
};

export default RootRoutes;
