import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

const TOKEN_KEY = "jiwekee_token";
const USER_KEY = "jiwekee_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.me();
      if (data && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        } catch (_e) {
          // ignore storage errors
        }
        return data.user;
      }
      setUser(null);
      localStorage.removeItem(USER_KEY);
      return null;
    } catch {
      // If token is invalid/expired
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setUser(null);
        localStorage.removeItem(USER_KEY);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  async function login(email, password, remember = true) {
    const data = await api.login({ email, password });
    const authUser = data.user;
    const authToken = data.token;

    if (authToken && remember) {
      try {
        localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      } catch (_e) {
        // ignore
      }
    }
    setToken(authToken || null);
    setUser(authUser);
    return authUser;
  }

  async function adminLogin(email, password) {
    const data = await api.adminLogin({ email, password });
    const authUser = data.user;
    const authToken = data.token;

    if (authToken) {
      try {
        localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      } catch (_e) {
        // ignore
      }
    }
    setToken(authToken || null);
    setUser(authUser);
    return authUser;
  }

  async function signup(payload) {
    const data = await api.signup(payload);
    const authUser = data.user;
    const authToken = data.token;

    if (authToken) {
      try {
        localStorage.setItem(TOKEN_KEY, authToken);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      } catch (_e) {
        // ignore
      }
    }
    setToken(authToken || null);
    setUser(authUser);
    return authUser;
  }

  async function register(payload) {
    return signup(payload);
  }

  async function logout() {
    try {
      await api.logout();
    } catch (_e) {
      // ignore
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (_e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  }

  function getStoredToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  const role = (user?.role || "customer").toLowerCase();
  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && (user.is_admin || role === "owner" || role === "manager" || role === "admin"));
  const isStaff = Boolean(
    user && (user.is_admin || ["owner", "manager", "cashier", "kitchen", "waiter", "accountant", "admin"].includes(role))
  );

  const hasRole = useCallback(
    (allowedRoles) => {
      if (!user) return false;
      if (isAdmin) return true;
      const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return list.map((r) => r.toLowerCase()).includes(role);
    },
    [user, isAdmin, role]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isStaff,
        role,
        hasRole,
        login,
        adminLogin,
        signup,
        register,
        logout,
        refreshUser,
        getStoredToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
