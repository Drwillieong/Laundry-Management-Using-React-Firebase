import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  onAuthStateChanged
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    address: "",
    email: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData({
              firstName: userDoc.data().firstName || "",
              lastName: userDoc.data().lastName || "",
              contact: userDoc.data().contact || "",
              address: userDoc.data().address || "",
              email: user.email || ""
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), userData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      
      setPasswordSuccess("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="bg-pink-500 p-5 flex justify-between items-center text-white shadow-lg">
        <h1 className="text-4xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <button 
            onClick={() => navigate('/')} 
            className="hover:underline font-bold"
          >
            Home
          </button>
          <button 
            onClick={() => navigate('/booking')} 
            className="hover:underline font-bold"
          >
            Book Now
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-pink-400">My Profile</h2>
        
        {isEditing ? (
          <form className="mt-4 space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                placeholder="First Name"
                className="w-full p-2 border rounded-md"
                required
              />
              <input
                type="text"
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                placeholder="Last Name"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className="w-full p-2 border rounded-md"
              required
              disabled
            />
            <input
              type="tel"
              name="contact"
              value={userData.contact}
              onChange={handleInputChange}
              placeholder="Contact Number"
              className="w-full p-2 border rounded-md"
              required
            />
            <input
              type="text"
              name="address"
              value={userData.address}
              onChange={handleInputChange}
              placeholder="Address"
              className="w-full p-2 border rounded-md"
              required
            />
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-pink-400 text-white px-4 py-2 rounded-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold">Name:</span>
              <span>{userData.firstName} {userData.lastName}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold">Email:</span>
              <span>{userData.email}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold">Contact:</span>
              <span>{userData.contact || "Not provided"}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold">Address:</span>
              <span>{userData.address || "Not provided"}</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-6 bg-pink-400 text-white px-4 py-2 rounded-md"
            >
              Edit Profile
            </button>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold text-center text-pink-400">Change Password</h3>
          <form className="mt-4 space-y-4" onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current Password"
              className="w-full p-2 border rounded-md"
              required
            />
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="New Password"
              className="w-full p-2 border rounded-md"
              required
              minLength="6"
            />
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm New Password"
              className="w-full p-2 border rounded-md"
              required
              minLength="6"
            />
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
            <button
              type="submit"
              className="w-full bg-pink-400 text-white p-2 rounded-md hover:bg-pink-600 transition"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;