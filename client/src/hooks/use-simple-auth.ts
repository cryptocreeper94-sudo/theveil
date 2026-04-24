import { useAuth } from "./use-auth";

export function useSimpleAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    login: firebaseLogin,
    signup,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    error,
  } = useAuth();

  const login = async (email: string, password: string, _rememberMe?: boolean) => {
    const result = await firebaseLogin(email, password);
    if (!result.success) {
      throw new Error(result.error || "Login failed");
    }
    return result;
  };

  const register = async (email: string, password: string, displayName?: string, _username?: string, _rememberMe?: boolean) => {
    const result = await signup(email, password, displayName);
    if (!result.success) {
      throw new Error(result.error || "Registration failed");
    }
    return result;
  };

  return {
    user,
    loading: isLoading,
    isAuthenticated,
    displayName: user?.displayName || user?.email?.split("@")[0] || "User",
    username: user?.username || user?.displayName || user?.email?.split("@")[0] || "User",
    email: user?.email,
    photoURL: user?.profileImageUrl,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    refetch: () => {},
    error,
  };
}
