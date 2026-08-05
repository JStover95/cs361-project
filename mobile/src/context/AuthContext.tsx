import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AUTHENTICATION_SERVICE_ENDPOINT } from "../utils/constants";

export const NETWORK_ERROR_MESSAGE =
  "Network request failed. Please try again.";

type AuthContextValue = {
  userId: string | null;
  isAuthenticating: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (path: string, body: Record<string, string>): Promise<boolean> => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const response = await fetch(
          `${AUTHENTICATION_SERVICE_ENDPOINT}${path}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : NETWORK_ERROR_MESSAGE
          );
          return false;
        }
        setUserId(data.user_id);
        return true;
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const signUp = useCallback(
    (email: string, password: string, passwordConfirmation: string) =>
      request("/register", {
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    [request]
  );

  const login = useCallback(
    (email: string, password: string) =>
      request("/login", { email, password }),
    [request]
  );

  const logout = useCallback(() => {
    setUserId(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      userId,
      isAuthenticating,
      error,
      signUp,
      login,
      logout,
      clearError,
    }),
    [userId, isAuthenticating, error, signUp, login, logout, clearError]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
