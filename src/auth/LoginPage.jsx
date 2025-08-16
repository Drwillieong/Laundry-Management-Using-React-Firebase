import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import pusa from "../assets/pusa.jpeg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';

import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const navigate = useNavigate();

  // Initialize reCAPTCHA
  useEffect(() => {
    if (showCaptcha && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // This will be called when reCAPTCHA is solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
      setRecaptchaVerifier(verifier);
    }
  }, [showCaptcha, recaptchaVerifier]);

  // Rate limiting for failed attempts
  useEffect(() => {
    if (failedAttempts >= 3) {
      setShowCaptcha(true);
    }
  }, [failedAttempts]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic client-side validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      // If there were 3 or more failed attempts, require reCAPTCHA
      if (failedAttempts >= 3 && recaptchaVerifier) {
        await recaptchaVerifier.verify();
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await auth.signOut();
        setError("Please verify your email before logging in. Check your inbox for a verification link.");
        setIsLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;

        // Reset failed attempts on successful login
        setFailedAttempts(0);
        setShowCaptcha(false);

        if (userRole === "admin") {
          alert("Admin login successful! Redirecting to dashboard...");
          navigate("/dashboard");
        } else if (userRole === "customer") {
          alert("Customer login successful! Redirecting to your personal page...");
          navigate("/schedule");
        } else {
          setError("Invalid user role.");
        }
      } else {
        setError("User role not found.");
      }
    } catch (err) {
      // Increment failed attempts counter
      setFailedAttempts(prev => prev + 1);
      
      // User-friendly error messages
      let errorMessage = "Login failed";
      switch (err.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password";
          break;
        case "auth/too-many-requests":
          errorMessage = "Account temporarily locked due to too many failed attempts. Please try again later or reset your password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email format";
          break;
        default:
          errorMessage = `Login failed: ${err.message}`;
      }
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    
    if (!resetEmail) {
      setResetMessage("Please enter your email address");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetMessage("Please enter a valid email address");
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
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>
      
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
                  autoComplete="username"
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
                  autoComplete="current-password"
                  minLength="8"
                />
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    className="mr-2"
                  />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
                <button 
                  type="button" 
                  className="text-gray-500 hover:underline"
                  onClick={() => setShowResetForm(true)}
                >
                  Forgot password?
                </button>
              </div>
              
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                  {failedAttempts >= 3 && (
                    <p className="mt-1 text-sm">For security, please complete the verification.</p>
                  )}
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-pink-500 to-pink-300 text-black p-3 rounded-full hover:opacity-90 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
              
              {/* Security tips */}
              <div className="text-xs text-gray-500 mt-4">
                <p className="font-semibold">Security Tips:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Never share your password with anyone</li>
                  <li>Use a strong, unique password</li>
                  <li>Log out after each session</li>
                </ul>
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
                    autoComplete="email"
                  />
                </div>
                {resetMessage && (
                  <p className={`text-sm mt-2 p-2 rounded-lg ${resetMessage.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
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
      <footer id="contact" className="bg-pink-400 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left items-center">
          <div className="py-4">
            <h3 className="text-xl font-bold mb-4">Socials</h3>
            <div className="flex justify-center md:justify-start space-x-6">
              <a 
                href="https://www.facebook.com/washitizzy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-pink-200 transition-colors"
              >
                <FontAwesomeIcon icon={faFacebook} size="2x" />
              </a>
              <a 
                href="https://www.instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-pink-200 transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} size="2x" />
              </a>
            </div>
          </div>

          <div className="py-4">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#service" className="text-white hover:text-pink-200 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white hover:text-pink-200 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div className="py-4">
            <h4 className="text-lg font-semibold mb-4">Get in Touch</h4>
            <p className="text-white">Email: washitizzy@email.com</p>
            <p className="text-white">Phone: 123456789</p>
          </div>
        </div>

        <div className="text-center text-white text-sm mt-12 pb-4">
          &copy; {new Date().getFullYear()} Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;