import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import pusa from "/Users/kevin/OneDrive/Desktop/Wash-it/Yizzy/src/assets/pusa.jpeg";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;

        if (userRole === "admin") {
          alert("Admin login successful! Redirecting to dashboard...");
          navigate("/dashboard");
        } else if (userRole === "customer") {
          alert("Customer login successful! Redirecting to your personal page...");
          navigate("/booking");
        } else {
          setError("Invalid user role.");
        }
      } else {
        setError("User role not found.");
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
      console.error("Login error:", err);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    
    if (!resetEmail) {
      setResetMessage("Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent. Please check your inbox.");
      setShowResetForm(false);
    } catch (error) {
      console.error("Error sending reset email:", error);
      setResetMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* Navbar */}
      <nav className="bg-pink-500 p-5 flex justify-between items-center text-white shadow-lg">
        <h1 className="text-4xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <a href="/" className="hover:underline font-semibold text-lg">Home</a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex justify-center items-center mt-12 lg:mt-16 p-6">
        {/* Left side: Image and Text */}
        <div className="flex-1 p-8 hidden lg:block">
          <img
            src={pusa}
            alt="Laundry Shop"
            className="w-[80%] h-[40vh] object-cover rounded-lg shadow-xl transition-all duration-300 hover:scale-105"
          />
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-bold text-pink-500">Welcome to Wash It Izzy!</h2>
            <p className="text-gray-700 mt-3">Your trusted laundry service. Login to manage orders and services.</p>
          </div>
        </div>

        {/* Right side: Login Form */}
        <div className="w-full max-w-md bg-white p-7 rounded-xl shadow-2xl border-2 border-pink-400">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
            Wash It Izzy
          </h2>
          <p className="text-center text-gray-500 font-semibold mb-6">Laundry shop</p>

          {!showResetForm ? (
            <form className="mt-4 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="text-gray-600">Email</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-gray-600">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end text-sm">
                <button 
                  type="button" 
                  className="text-gray-500 hover:underline"
                  onClick={() => setShowResetForm(true)}
                >
                  Forgot password?
                </button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-300 text-black p-3 rounded-full hover:opacity-90 transition-all"
                >
                  Login
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              <h3 className="text-xl font-semibold text-center">Reset Password</h3>
              <p className="text-sm text-gray-600 text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handlePasswordReset}>
                <div className="mt-4">
                  <label className="text-gray-600">Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 transition-all"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                {resetMessage && (
                  <p className={`text-sm mt-2 ${resetMessage.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                    {resetMessage}
                  </p>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    className="text-gray-500 hover:underline"
                    onClick={() => setShowResetForm(false)}
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-pink-300 text-black px-4 py-2 rounded-full hover:opacity-90 transition-all"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold">Wash It Izzy</h3>
            <p className="mt-2 text-gray-400">God will provide.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white">Home</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Get in Touch</h4>
            <p className="mt-2 text-gray-400">Email: washitizzy@email.com</p>
            <p className="text-gray-400">Phone: 123456789</p>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm mt-8">
          &copy; 2025 Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;