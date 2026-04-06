// ============================================
// SCAN2WIN — Route Auth Guards
// Worldbex Events "Scan to Win" Platform
//
// <Auth>   — Requires valid token + userData; redirects to login otherwise.
// <UnAuth> — Blocks authenticated users; redirects to CMS dashboard.
// ============================================

import { Navigate, Outlet } from "react-router";
import { useCurrentActiveUserToken } from "../store/useAdminAuthStore";
import { useEffect } from "react";

export const Auth = ({ store, redirect }) => {
  const { token, userData } = store();
  const { setToken, setUser } = useCurrentActiveUserToken();

  // Sync the active-user token store whenever the auth store changes
  useEffect(() => {
    if (token) setToken(token);
    if (userData) setUser(userData?.userTypeAuth);
  }, [token, userData, setToken, setUser]);

  return userData && token ? <Outlet /> : <Navigate to={redirect} />;
};

export const UnAuth = ({ store, redirect = "/" }) => {
  const { token, userData } = store();

  return userData && token ? <Navigate to={redirect} /> : <Outlet />;
};
