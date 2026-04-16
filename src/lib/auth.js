import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api,{ publicApi } from "./api";
import { findDemoAccount, isDemoToken } from "./demoUsers";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("agereboot_token");
    const savedUser = localStorage.getItem("agereboot_user");
  if (savedToken && savedUser && savedUser !== "undefined") {
  try {
    const parsedUser = JSON.parse(savedUser);
    setToken(savedToken);
    setUser(parsedUser);

    if (isDemoToken(savedToken)) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then((res) => {
        const freshUser = res.data;
        setUser(freshUser);
        localStorage.setItem("agereboot_user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem("agereboot_token");
        localStorage.removeItem("agereboot_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  } catch (error) {
    localStorage.removeItem("agereboot_token");
    localStorage.removeItem("agereboot_user");
    setToken(null);
    setUser(null);
    setLoading(false);
  }
} else {
  setLoading(false);
}
  }, []);

const login = useCallback(async (username_or_email, password) => {
  const demoAccount = findDemoAccount(username_or_email, password);

  if (demoAccount) {
    const demoToken = `demo:${demoAccount.user.role}`;
    localStorage.setItem("agereboot_token", demoToken);
    localStorage.setItem("agereboot_user", JSON.stringify(demoAccount.user));
    setToken(demoToken);
    setUser(demoAccount.user);
    return demoAccount.user;
  }

  const res = await publicApi.post("/login/", {
    username_or_email,
    password,
  });

  const responseData = res.data?.data;

  const t = responseData?.access_token;
  const u = {
    user_id: responseData?.user_id,
    username: responseData?.username,
    email: responseData?.email,
    role_id: responseData?.role_id,
    role: responseData?.role,
  };

  if (!t || !u?.role) {
    throw new Error("Invalid login response");
  }

  localStorage.setItem("agereboot_token", t);
  localStorage.setItem("agereboot_user", JSON.stringify(u));
  setToken(t);
  setUser(u);

  return u;
}, []);

  const register = useCallback(async (data) => {
    const res = await publicApi.post("/register/", data);
    const { token: t, user: u } = res.data;
    localStorage.setItem("agereboot_token", t);
    localStorage.setItem("agereboot_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("agereboot_token");
    localStorage.removeItem("agereboot_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
