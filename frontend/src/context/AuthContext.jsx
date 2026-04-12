// AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
// This is the "global store" for auth state.
// Any component anywhere in the app can call useAuth()
// to get the current user, their role, and loading state.
//
// How it works:
// 1. Firebase tells us when login state changes (onAuthStateChanged)
// 2. We fetch the user's MongoDB profile from our backend (/api/auth/me)
// 3. We make both available to every component via useAuth() hook

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";

// Create the context — think of it as an empty box we'll fill with data
const AuthContext = createContext(null);

// This is the component that wraps your whole app and provides the data
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase user object
  const [dbUser, setDbUser] = useState(null);   // MongoDB user (has role, skills etc.)
  const [loading, setLoading] = useState(true); // true while we check login state
  const [authError, setAuthError] = useState(null);

  const fetchProfile = async (firebaseUser) => {
    try {
      setAuthError(null);
      const token = await firebaseUser.getIdToken();
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDbUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      const msg = error.response?.data?.message || error.message;
      setAuthError(`Server connection issue: ${msg}`);
      setDbUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchProfile(firebaseUser);
      } else {
        setUser(null);
        setDbUser(null);
        setAuthError(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user);
    }
  };

  // logout function — components call this to sign out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setDbUser(null);
  };

  // Everything we expose to the rest of the app
  const value = {
    user,           // Firebase user (has uid, email)
    dbUser,         // MongoDB user (has role, name, skills)
    loading,        // true while checking auth state
    authError,      // error message if profile fetch fails
    logout,         // function to call on logout button
    refreshProfile, // manually re-fetch profile (for Retry buttons)
    isManager: dbUser?.role === "manager",
    isEmployee: dbUser?.role === "employee",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <LoadingSpinner />}
    </AuthContext.Provider>
  );
}

// Custom hook — instead of writing useContext(AuthContext) everywhere,
// components just call useAuth() to get everything above
export function useAuth() {
  return useContext(AuthContext);
}
