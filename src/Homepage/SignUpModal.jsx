import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase'; // Adjust the import according to your firebase setup
import { createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import facebookpng from "../assets/facebook.png";
import googlepng from "../assets/goggle.png"; 


const SignUpModal = ({ showSignUpModal, setShowSignUpModal }) => {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false); // Manage state internally
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


// SignUpModal.jsx
const handleEmailSignUp = async (e) => {
  e.preventDefault();

  const { firstName, lastName, contact, email, password, agreeToTerms } = formData;
  if (!firstName || !lastName || !contact || !email || !password || !agreeToTerms) {
    alert("All fields are required, and you must agree to the terms.");
    return;
  }

  try {
    // Check if the email is already registered
    const userRef = doc(db, "users", email); // Check by email
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      alert("This email is already registered. Redirecting to login...");
      navigate("/login");
      return;
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);
    alert("A verification email has been sent. Please check your inbox.");

    // Store user data in Firestore using UID as the document ID
    await setDoc(doc(db, "users", user.uid), { // Use UID as the document ID
      firstName,
      lastName,
      contact,
      email: user.email,
      role: "customer",
    });

    // Close the modal and navigate to login
    setShowSignUpModal(false);
    setShowEmailForm(false);
    navigate("/login");
  } catch (error) {
    console.error("Error signing up:", error);
    alert("Failed to sign up. Please try again.");
  }
};

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user already exists in Firestore
      const userRef = doc(db, "users", user.email); // Use email as the document ID
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        alert("This Google account is already registered. Redirecting to booking...");
        navigate("/booking"); // Navigate to booking page
        return;
      }

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.email), { // Use email as the document ID
        email: user.email,
        role: "customer",
        provider: "Google",
      });

      alert(`Signed up successfully using Google: ${user.email}`);
      setShowSignUpModal(false);
      navigate("/booking"); // Navigate to booking page
    } catch (error) {
      console.error("Error signing up with Google:", error);
      alert("Failed to sign up with Google. Please try again.");
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user already exists in Firestore
      const userRef = doc(db, "users", user.email); // Use email as the document ID
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        alert("This Facebook account is already registered. Redirecting to booking...");
        navigate("/booking"); // Navigate to booking page
        return;
      }

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.email), { // Use email as the document ID
        email: user.email,
        role: "customer",
        provider: "Facebook",
      });

      alert(`Signed up successfully using Facebook: ${user.email}`);
      setShowSignUpModal(false);
      navigate("/booking"); // Navigate to booking page
    } catch (error) {
      console.error("Error signing up with Facebook:", error);
      alert("Failed to sign up with Facebook. Please try again.");
    }
  };

  return (
    <>
     {/* Main Sign-Up Modal */}
{showSignUpModal && !showEmailForm && (
  <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-center z-50 ">
    <div className="bg-white p-6 rounded-xl shadow-xl w-96 text-center border-2 border-pink-400 ">
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
              <input type="text" name="firstName" placeholder="First Name" className="w-full border rounded-md p-2 mb-3" onChange={handleChange} />
              <input type="text" name="lastName" placeholder="Last Name" className="w-full border rounded-md p-2 mb-3" onChange={handleChange} />
              <input type="text" name="contact" placeholder="Contact Number" className="w-full border rounded-md p-2 mb-3" onChange={handleChange} />
              <input type="email" name="email" placeholder="Email" className="w-full border rounded-md p-2 mb-3" onChange={handleChange} />
              <input type="password" name="password" placeholder="Password" className="w-full border rounded-md p-2 mb-3" onChange={handleChange} />
              <label className="flex items-center text-sm mb-3">
                <input type="checkbox" name="agreeToTerms" className="mr-2" onChange={handleChange} />
                I agree to the <span className="text-blue-500 cursor-pointer ml-1">Terms & Privacy Policy</span>
              </label>
              <button type="submit" className="w-full  from-pink-500 to-pink-300  text-black py-2 rounded-md font-semibold">Sign Up</button>
            </form>
            <button onClick={() => setShowEmailForm(false)} className="mt-3 text-black font-medium">Back</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SignUpModal;   