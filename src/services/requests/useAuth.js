import { useMutation } from "@tanstack/react-query";
import { Modal } from "antd";
import { loginApi } from "../api/api";
import { userTypeAuth } from "../api/axios";
import {
  useAdminAuthStore,
  useCurrentActiveUserToken,
} from "../../store/useAdminAuthStore";

// Auth response shape:
// { success, data: { admin: { adminId, username, email, fullName },
//                    accessToken: "string", tokenType, expiresIn, expiresAt } }
// No refresh token — accessToken is valid for 24h.

export const useLoginAdminAuth = () => {
  const { setToken, setUserData } = useAdminAuthStore.getState();
  const { setToken: setActiveToken, setUser: setActiveUser } =
    useCurrentActiveUserToken.getState();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: ({ data }) => {
      setToken(data.accessToken);
      setUserData({
        ...data.admin,
        userType: "ADMIN",
        userTypeAuth: userTypeAuth.admin,
      });
      setActiveToken(data.accessToken);
      setActiveUser(userTypeAuth.admin);
    },
    onSettled: () => {
      Modal.destroyAll();
    },
  });
};
