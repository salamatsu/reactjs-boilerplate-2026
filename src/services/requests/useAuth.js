import { useMutation } from "@tanstack/react-query";
import { Modal } from "antd";
import { loginApi, refreshTokenApi, logoutApi } from "../api/api";
import { userTypeAuth } from "../api/axios";
import {
  useAdminAuthStore,
  useCurrentActiveUserToken,
} from "../../store/useAdminAuthStore";

export const useLoginAdminAuth = () => {
  const { setToken, setRefreshToken, setUserData } = useAdminAuthStore.getState();
  const { setToken: setActiveToken, setUser: setActiveUser } =
    useCurrentActiveUserToken.getState();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: ({ data }) => {
      setToken(data.accessToken.token);
      setRefreshToken(data.refreshToken.token);
      setUserData({
        ...data.user,
        userType: "ADMIN",
        userTypeAuth: userTypeAuth.admin,
      });
      setActiveToken(data.accessToken.token);
      setActiveUser(userTypeAuth.admin);
    },
    onSettled: () => {
      Modal.destroyAll();
    },
  });
};

export const useRefreshAdminAuth = () => {
  const { setToken, setRefreshToken } = useAdminAuthStore.getState();
  const { setToken: setActiveToken } = useCurrentActiveUserToken.getState();

  return useMutation({
    // Read refreshToken fresh from store at call time, not at hook init time
    mutationFn: () => {
      const { refreshToken } = useAdminAuthStore.getState();
      return refreshTokenApi(refreshToken);
    },
    onSuccess: ({ data }) => {
      setToken(data.accessToken.token);
      setActiveToken(data.accessToken.token);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken.token);
      }
    },
  });
};

export const useLogoutAdminAuth = () => {
  const { reset } = useAdminAuthStore.getState();
  const { reset: resetActiveUser } = useCurrentActiveUserToken.getState();

  return useMutation({
    // Read refreshToken fresh from store at call time, not at hook init time
    mutationFn: () => {
      const { refreshToken } = useAdminAuthStore.getState();
      return logoutApi(refreshToken);
    },
    onSuccess: () => {
      reset();
      resetActiveUser();
    },
  });
};
