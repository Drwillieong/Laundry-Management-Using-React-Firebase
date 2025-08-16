import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase';
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup,
  sendEmailVerification,
  RecaptchaVerifier
} from 'firebase/auth';
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
  const [errors, setErrors] = useState({});
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (showSignUpModal && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'signup-recaptcha-container', {
        'size': 'invisible',
        'callback': () => {},
        'expired-callback': () => {
          setErrors(prev => ({...prev, recaptcha: 'Security verification expired. Please try again.'}));
        }
      });
      setRecaptchaVerifier(verifier);
    }
  }, [showSignUpModal, recaptchaVerifier]);

  // Password strength calculator
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      // Length check
      if (formData.password.length >= 8) strength += 1;
      if (formData.password.length >= 12) strength += 1;
      // Complexity checks
      if (/[A-Z]/.test(formData.password)) strength += 1;
      if (/[0-9]/.test(formData.password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.contact.trim()) newErrors.contact = "Phone number is required";
    else if (!phoneRegex.test(formData.contact)) newErrors.contact = "Invalid phone number";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must accept the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Verify reCAPTCHA
      if (recaptchaVerifier) {
        await recaptchaVerifier.verify();
      }

      const { firstName, lastName, contact, email, password } = formData;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

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
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      setShowSignUpModal(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/CustomAccSet");
    } catch (error) {
      console.error("Error signing up:", error);
      let errorMessage = "Failed to sign up. Please try again.";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered. Please log in instead.";
          navigate("/login");
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email format.";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later.";
          break;
      }
      
      setErrors(prev => ({...prev, form: errorMessage}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider, providerName) => {
    setIsLoading(true);
    try {
      // Verify reCAPTCHA for social sign-ups too
      if (recaptchaVerifier) {
        await recaptchaVerifier.verify();
      }

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
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      setShowSignUpModal(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/CustomAccSet");
    } catch (error) {
      console.error(`Error signing up with ${providerName}:`, error);
      let errorMessage = `Failed to sign up with ${providerName}. Please try again.`;
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email. Try signing in with a different method.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in popup was closed. Please try again.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign in was cancelled. Please try again.';
      }
      
      setErrors(prev => ({...prev, form: errorMessage}));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    const provider = new GoogleAuthProvider();
    // Add additional scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      'prompt': 'select_account' // Forces account selection even when logged in
    });
    handleSocialSignUp(provider, "Google");
  };

  const handleFacebookSignUp = () => {
    const provider = new FacebookAuthProvider();
    // Add additional scopes if needed
    provider.addScope('public_profile');
    provider.addScope('email');
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
              aria-label="Close terms modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose">
            <h3>Terms of Service</h3>
            <p>By creating an account, you agree to our Terms of Service...</p>
            
            <h3>Privacy Policy</h3>
            <p>We respect your privacy and are committed to protecting your personal data...</p>
            
            <h3>Security Measures</h3>
            <ul>
              <li>We use industry-standard encryption to protect your data</li>
              <li>Passwords are securely hashed and never stored in plain text</li>
              <li>We implement rate limiting to prevent brute force attacks</li>
              <li>All sensitive communications are encrypted</li>
            </ul>
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

  const PrivacyPolicyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Privacy Policy</h2>
            <button 
              onClick={() => setShowPrivacyModal(false)} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close privacy modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose">
            <h3>Data Collection</h3>
            <p>We collect only the necessary information to provide our services...</p>
            
            <h3>Data Protection</h3>
            <p>Your data is protected using industry-standard security measures...</p>
            
            <h3>Third-Party Services</h3>
            <p>We use trusted third-party services like Firebase for authentication...</p>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PasswordStrengthIndicator = () => {
    const strengthColors = [
      'bg-red-500', 
      'bg-orange-500', 
      'bg-yellow-500', 
      'bg-blue-500', 
      'bg-green-500'
    ];
    
    return (
      <div className="mt-2">
        <div className="flex gap-1 h-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div 
              key={level}
              className={`flex-1 rounded-full ${passwordStrength > level ? strengthColors[level] : 'bg-gray-200'}`}
            ></div>
          ))}
        </div>
        <p className="text-xs mt-1 text-gray-600">
          {passwordStrength < 2 ? 'Weak' : 
           passwordStrength < 4 ? 'Moderate' : 'Strong'} password
        </p>
      </div>
    );
  };

  return (
    <>
      {/* reCAPTCHA container (invisible) */}
      <div id="signup-recaptcha-container"></div>
      
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
            
            {errors.form && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errors.form}
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignUp}
                className="w-full border border-gray-300 py-3 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 active:scale-95"
                aria-label="Sign up with Google"
              >
                <img src={googlepng} alt="Google" className="w-6 h-6 mr-3" />
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>
              
              <button
                onClick={handleFacebookSignUp}
                className="w-full bg-[#1877F2] text-white py-3 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[#166FE5] active:scale-95"
                aria-label="Sign up with Facebook"
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
              aria-label="Close sign up modal"
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
                aria-label="Back to sign up options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
            
            {errors.form && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errors.form}
              </div>
            )}
            
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input 
                    type="text" 
                    name="firstName" 
                    placeholder="First Name" 
                    className={`w-full border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                    onChange={handleChange} 
                    value={formData.firstName}
                    required
                    aria-label="First name"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input 
                    type="text" 
                    name="lastName" 
                    placeholder="Last Name" 
                    className={`w-full border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                    onChange={handleChange} 
                    value={formData.lastName}
                    required
                    aria-label="Last name"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>
              
              <div>
                <input 
                  type="tel" 
                  name="contact" 
                  placeholder="Phone Number" 
                  className={`w-full border ${errors.contact ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                  onChange={handleChange} 
                  value={formData.contact}
                  required
                  aria-label="Phone number"
                />
                {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
              </div>
              
              <div>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                  onChange={handleChange} 
                  value={formData.email}
                  required
                  aria-label="Email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Password (min 8 characters)" 
                  className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all`}
                  onChange={handleChange} 
                  value={formData.password}
                  required
                  minLength="8"
                  aria-label="Password"
                />
                {formData.password && <PasswordStrengthIndicator />}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    name="agreeToTerms" 
                    className={`w-4 h-4 text-pink-600 bg-pink-500 ${errors.agreeToTerms ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-pink-500`}
                    onChange={handleChange} 
                    checked={formData.agreeToTerms}
                    required
                    aria-label="Agree to terms"
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
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </label>
                  {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
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