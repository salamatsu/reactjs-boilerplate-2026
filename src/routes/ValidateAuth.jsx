import { Navigate, Outlet } from "react-router";
import { useCurrentActiveUserToken } from "../store/useAdminAuthStore";
import { useEffect } from "react";

export const Auth = ({ store, redirect }) => {
  const { token, userData } = store();
  const { setToken, setUser } = useCurrentActiveUserToken();

  useEffect(() => {
    if (token) {
      setToken(token);
    }

    if (userData) {
      setUser(userData?.userTypeAuth);
    }
  }, [token, userData]);

  return userData && token ? <Outlet /> : <Navigate to={redirect} />;
};

export const UnAuth = ({ store, redirect = "/" }) => {
  const { token, userData } = store();

  return userData && token ? <Navigate to={redirect} /> : <Outlet />;
};
