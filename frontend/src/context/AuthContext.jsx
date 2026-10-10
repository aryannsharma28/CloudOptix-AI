import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const API_BASE = "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudoptix_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("cloudoptix_token") || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState(null);

  // Validate active session on initial mount
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("cloudoptix_user", JSON.stringify(data.user));
          } else {
            // Invalid session
            logout();
          }
        })
        .catch(() => {
          // If backend was temporarily unreachable, keep cached user
        });
    }
  }, [token]);

  /**
   * Dispatches 6-digit OTP to mobile phone number
   */
  const sendPhoneOtp = async (phoneNumber) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/phone/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate OTP.");
      }

      setLastGeneratedOtp(data.otp);
      return { success: true, otp: data.otp, message: data.message };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Verifies OTP and completes phone sign-in
   */
  const verifyPhoneOtp = async (phoneNumber, otp, name) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/phone/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp, name })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to verify OTP.");
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("cloudoptix_user", JSON.stringify(data.user));
      localStorage.setItem("cloudoptix_token", data.token);
      setIsAuthModalOpen(false);
      setLastGeneratedOtp(null);

      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Google (Gmail) Sign-In
   */
  const loginWithGoogle = async (googleProfile) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleProfile)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Google authentication failed.");
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("cloudoptix_user", JSON.stringify(data.user));
      localStorage.setItem("cloudoptix_token", data.token);
      setIsAuthModalOpen(false);

      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Email and Password Sign-In
   */
  const loginWithPassword = async ({ email, password, rememberMe = true }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Authentication failed. Check your email and password.");
      }

      setUser(data.user);
      setToken(data.token);
      if (rememberMe) {
        localStorage.setItem("cloudoptix_user", JSON.stringify(data.user));
        localStorage.setItem("cloudoptix_token", data.token);
      } else {
        sessionStorage.setItem("cloudoptix_user", JSON.stringify(data.user));
        sessionStorage.setItem("cloudoptix_token", data.token);
      }
      setIsAuthModalOpen(false);

      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Email and Password Registration
   */
  const registerWithPassword = async ({ email, password, name, role = "USER" }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Registration failed.");
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("cloudoptix_user", JSON.stringify(data.user));
      localStorage.setItem("cloudoptix_token", data.token);
      setIsAuthModalOpen(false);

      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Logout user and invalidate session
   */
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Ensure AWS account connection is also terminated on user logout
      await fetch(`${API_BASE}/aws/disconnect`, {
        method: "POST"
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("cloudoptix_user");
      localStorage.removeItem("cloudoptix_token");
      sessionStorage.removeItem("cloudoptix_user");
      sessionStorage.removeItem("cloudoptix_token");
      setLastGeneratedOtp(null);
    }
  };

  const isAdmin = !!(
    user && (
      String(user.role || "").toUpperCase() === "ADMIN" ||
      user.role === "Cloud Administrator" ||
      user.email === "admin@cloudoptix.ai" ||
      user.email === "aryan.cloud@gmail.com"
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionToken: token,
        isAuthenticated: !!user,
        isAdmin,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authLoading,
        authError,
        setAuthError,
        lastGeneratedOtp,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithGoogle,
        loginWithPassword,
        registerWithPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
