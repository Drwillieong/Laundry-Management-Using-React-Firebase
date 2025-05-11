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
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const LoadingSpinner = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mb-4"></div>
          <p className="text-white font-medium">Creating your account...</p>
        </div>
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { firstName, lastName, contact, email, password, agreeToTerms } = formData;
    if (!firstName || !lastName || !contact || !email || !password || !agreeToTerms) {
      alert("All fields are required, and you must agree to the terms.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setShowSignUpModal(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate("/schedule");
        return;
      }

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
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/CustomAccSet");
    } catch (error) {
      console.error("Error signing up:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please log in instead.");
        navigate("/login");
      } else {
        alert("Failed to sign up. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider, providerName) => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setShowSignUpModal(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate("/schedule");
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "customer",
        provider: providerName,
        emailVerified: user.emailVerified,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
      });

      setShowSignUpModal(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/CustomAccSet");
    } catch (error) {
      console.error(`Error signing up with ${providerName}:`, error);
      alert(`Failed to sign up with ${providerName}. Please try again.`);
    } finally {
      setIsLoading(false);
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

  const TermsOfServiceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Terms of Service and Privacy</h2>
            <button 
              onClick={() => setShowTermsModal(false)} 
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose">
          
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowTermsModal(false)}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  

  return (
    <>
      {/* Loading Spinner - highest z-index */}
      {isLoading && <LoadingSpinner />}

      {/* Terms and Privacy Modals - higher than signup modal */}
      {showTermsModal && <TermsOfServiceModal />}
      {showPrivacyModal && <PrivacyPolicyModal />}

      {/* Main Sign-Up Modal - lower z-index */}
      {showSignUpModal && !showEmailForm && !isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold mb-2">Join Us</h2>
              <p className="text xl">Create your account </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignUp}
                className="w-full border border-gray-300 py-3 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 active:scale-95"
              >
                <img src={googlepng} alt="Google" className="w-6 h-6 mr-3" />
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>
              
              <button
                onClick={handleFacebookSignUp}
                className="w-full bg-[#1877F2] text-white py-3 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[#166FE5] active:scale-95"
              >
                <img src={facebookpng} alt="Facebook" className="w-6 h-6 mr-3 filter brightness-0 invert" />
                <span className="font-medium">Continue with Facebook</span>
              </button>
              
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-4 text-gray-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:opacity-90 active:scale-95"
              >
                Sign up with Email
              </button>
            </div>
            
            <p className="mt-6 text-gray-600">
              Already have an account?{" "}
              <button
                className="text-pink-500 font-medium hover:text-pink-600 hover:underline focus:outline-none"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </p>
            
            <button
              onClick={() => setShowSignUpModal(false)}
              className="mt-4 text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Email Sign-Up Modal - lower z-index */}
      {showEmailForm && !isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
              <button 
                onClick={() => setShowEmailForm(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input 
                    type="text" 
                    name="firstName" 
                    placeholder="First Name" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    onChange={handleChange} 
                    required
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    name="lastName" 
                    placeholder="Last Name" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    onChange={handleChange} 
                    required
                  />
                </div>
              </div>
              
              <input 
                type="tel" 
                name="contact" 
                placeholder="Phone Number" 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                onChange={handleChange} 
                required
              />
              
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                onChange={handleChange} 
                required
              />
              
              <input 
                type="password" 
                name="password" 
                placeholder="Password" 
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                onChange={handleChange} 
                required
              />
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    name="agreeToTerms" 
                    className="w-4 h-4 text-pink-600 bg-pink-500 border-gray-300 rounded focus:ring-pink-500"
                    onChange={handleChange} 
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="text-gray-600">
                    I agree to the{" "}
                    <button 
                      type="button" 
                      onClick={() => setShowTermsModal(true)}
                      className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button 
                      type="button" 
                      onClick={() => setShowTermsModal(true)}
                      className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 active:scale-95"
              >
                Create Account
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setShowEmailForm(false)} 
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                ← Back to sign up options
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignUpModal;