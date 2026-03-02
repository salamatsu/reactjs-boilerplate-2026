import { Suspense, lazy } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  ScrollRestoration,
} from "react-router";
import LoadingFallback from "../components/LoadingFallback";

// Lazy load pages
const LandingPage = lazy(() => import("../pages/LandingPage"));
const Register = lazy(() => import("../pages/Register"));
const AdminRoute = lazy(() => import("./pageRoutes/AdminRoute"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Layout component with scroll restoration
const Layout = ({ children }) => (
  <>
    <ScrollRestoration />
    {children}
  </>
);

const RootRoutes = () => {
  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <LandingPage />
            </Suspense>
          </Layout>
        ),
      },
      {
        path: "/register",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Register />
            </Suspense>
          </Layout>
        ),
      },
      {
        path: "/admin/*",
        element: (
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <AdminRoute />
            </Suspense>
          </Layout>
        ),
      },
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
    },
  );

  return <RouterProvider router={router} />;
};

export default RootRoutes;
