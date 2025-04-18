// src/ProtectedRoute.js
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login"); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return children;
};

export default ProtectedRoute;