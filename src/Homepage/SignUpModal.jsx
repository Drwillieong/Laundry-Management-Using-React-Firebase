import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import facebookpng from "../assets/facebook.png";
import googlepng from "../assets/goggle.png"; 

const SignUpModal = ({ showSignUpModal, setShowSignUpModal }) => {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();

    const { firstName, lastName, contact, email, password, agreeToTerms } = formData;
    if (!firstName || !lastName || !contact || !email || !password || !agreeToTerms) {
      alert("All fields are required, and you must agree to the terms.");
      return;
    }

    try {
      // Check if the email is already registered by UID (after creating user)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Existing user - redirect to schedule
        setShowSignUpModal(false);
        navigate("/schedule");
        return;
      }

      // New user - store data and redirect to account setup
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        contact,
        email: user.email,
        role: "customer",
        emailVerified: user.emailVerified,
        provider: "email",
      });

      setShowSignUpModal(false);
      navigate("/CustomAccSet");
    } catch (error) {
      console.error("Error signing up:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please log in instead.");
        navigate("/login");
      } else {
        alert("Failed to sign up. Please try again.");
      }
    }
  };

  const handleSocialSignUp = async (provider, providerName) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Existing user - redirect to schedule
        setShowSignUpModal(false);
        navigate("/schedule");
        return;
      }

      // New user - store data and redirect to account setup
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "customer",
        provider: providerName,
        emailVerified: user.emailVerified,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
      });

      setShowSignUpModal(false);
      navigate("/CustomAccSet");
    } catch (error) {
      console.error(`Error signing up with ${providerName}:`, error);
      alert(`Failed to sign up with ${providerName}. Please try again.`);
    }
  };

  const handleGoogleSignUp = () => {
    const provider = new GoogleAuthProvider();
    handleSocialSignUp(provider, "Google");
  };

  const handleFacebookSignUp = () => {
    const provider = new FacebookAuthProvider();
    handleSocialSignUp(provider, "Facebook");
  };

  return (
    <>
      {/* Main Sign-Up Modal */}
      {showSignUpModal && !showEmailForm && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 text-center border-2 border-pink-400">
            <h2 className="text-xl font-bold mb-4">Sign Up</h2>
            <button
              onClick={handleGoogleSignUp}
              className="w-full border py-2 rounded-md flex items-center justify-center mb-3 hover:bg-gray-100 transition"
            >
              <img src={googlepng} alt="Google" className="w-5 h-5 mr-2" />
              Sign up with Google
            </button>
            <button
              onClick={handleFacebookSignUp}
              className="w-full bg-[#1877F2] text-white py-2 rounded-md flex items-center justify-center mb-3 hover:bg-[#165db6] transition"
            >
              <img src={facebookpng} alt="Facebook" className="w-5 h-5 mr-2" />
              Sign up with Facebook
            </button>
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-orange-500 text-white py-2 rounded-md font-semibold hover:bg-orange-600 transition"
            >
              Sign up with Email
            </button>
            <p className="mt-3 text-gray-500">
              Already have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer hover:underline"
                onClick={() => navigate("/login")}
              >
                Log in instead
              </span>
            </p>
            <button
              onClick={() => setShowSignUpModal(false)}
              className="mt-3 text-gray-500 hover:text-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Email Sign-Up Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 border-2 border-pink-400">
            <h2 className="text-lg font-bold mb-4">Sign Up with Email</h2>
            <form onSubmit={handleEmailSignUp}>
              <input 
                type="text" 
                name="firstName" 
                placeholder="First Name" 
                className="w-full border rounded-md p-2 mb-3" 
                onChange={handleChange} 
                required
              />
              <input 
                type="text" 
                name="lastName" 
                placeholder="Last Name" 
                className="w-full border rounded-md p-2 mb-3" 
                onChange={handleChange} 
                required
              />
              <input 
                type="tel" 
                name="contact" 
                placeholder="Contact Number" 
                className="w-full border rounded-md p-2 mb-3" 
                onChange={handleChange} 
                required
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                className="w-full border rounded-md p-2 mb-3" 
                onChange={handleChange} 
                required
              />
              <input 
                type="password" 
                name="password" 
                placeholder="Password" 
                className="w-full border rounded-md p-2 mb-3" 
                onChange={handleChange} 
                required
              />
              <label className="flex items-center text-sm mb-3">
                <input 
                  type="checkbox" 
                  name="agreeToTerms" 
                  className="mr-2" 
                  onChange={handleChange} 
                  required
                />
                I agree to the <span className="text-blue-500 cursor-pointer ml-1">Terms & Privacy Policy</span>
              </label>
              <button 
                type="submit" 
                className="w-full from-pink-500 to-pink-300 text-black py-2 rounded-md font-semibold"
              >
                Sign Up
              </button>
            </form>
            <button 
              onClick={() => setShowEmailForm(false)} 
              className="mt-3 text-black font-medium"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SignUpModal;