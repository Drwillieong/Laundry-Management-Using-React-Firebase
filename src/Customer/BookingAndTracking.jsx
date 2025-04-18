import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const BookingAndTracking = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [bookingData, setBookingData] = useState({
    name: "",
    contact: "",
    address: "",
    landmark: "",
    pickupTime: "9am-10am",
    itemsCount: "",
    instructions: "",
    status: "pending",
    userId: "",
    createdAt: null
  });
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            setBookingData(prev => ({
              ...prev,
              name: `${userDoc.data().firstName || ''} ${userDoc.data().lastName || ''}`.trim(),
              contact: userDoc.data().contact || "",
              address: userDoc.data().address || "",
              userId: user.uid
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingWithTimestamp = {
        ...bookingData,
        createdAt: new Date(),
        itemsCount: parseInt(bookingData.itemsCount),
        userId: auth.currentUser?.uid
      };

      const docRef = await addDoc(collection(db, "orders"), bookingWithTimestamp);
      alert(`Booking successful! Your order ID is: ${docRef.id}`);
      setBookingData(prev => ({
        ...prev,
        landmark: "",
        pickupTime: "9am-10am",
        itemsCount: "",
        instructions: "",
      }));
      setTrackingId(docRef.id);
    } catch (error) {
      console.error("Error adding booking:", error);
      alert("Error creating booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setLoading(true);
    try {
      const orderDoc = await getDoc(doc(db, "orders", trackingId));
      
      if (!orderDoc.exists()) {
        setTrackingResult(null);
        alert("No order found with that ID");
      } else {
        setTrackingResult({ id: orderDoc.id, ...orderDoc.data() });
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      alert("Error tracking order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
            onClick={() => navigate('/userprofile')} 
            className="hover:underline font-bold"
          >
            Profile
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-pink-400">Book a Laundry Pickup</h2>
        <form className="mt-4 space-y-4" onSubmit={handleBookingSubmit}>
          <input
            type="text"
            name="name"
            value={bookingData.name}
            onChange={handleBookingChange}
            placeholder="Name"
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="tel"
            name="contact"
            value={bookingData.contact}
            onChange={handleBookingChange}
            placeholder="Contact Number"
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="text"
            name="address"
            value={bookingData.address}
            onChange={handleBookingChange}
            placeholder="Address"
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="text"
            name="landmark"
            value={bookingData.landmark}
            onChange={handleBookingChange}
            placeholder="Landmark (Optional)"
            className="w-full p-2 border rounded-md"
          />
          <select
            name="pickupTime"
            value={bookingData.pickupTime}
            onChange={handleBookingChange}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="9am-10am">9:00 AM - 10:00 AM</option>
            <option value="10am-11am">10:00 AM - 11:00 AM</option>
            <option value="11am-12pm">11:00 AM - 12:00 PM</option>
            <option value="3pm-4pm">3:00 PM - 4:00 PM</option>
          </select>
          <input
            type="number"
            name="itemsCount"
            value={bookingData.itemsCount}
            onChange={handleBookingChange}
            placeholder="Number of Clothes"
            className="w-full p-2 border rounded-md"
            required
            min="1"
          />
          <textarea
            name="instructions"
            value={bookingData.instructions}
            onChange={handleBookingChange}
            placeholder="Special Instructions"
            className="w-full p-2 border rounded-md"
          ></textarea>
          <button
            type="submit"
            className="w-full bg-pink-400 text-white p-2 rounded-md hover:bg-pink-600 transition"
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit Booking"}
          </button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto mt-10 mb-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-green-500">Track Your Order</h2>
        <form className="mt-4 space-y-4" onSubmit={handleTrackOrder}>
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter Order Number"
            className="w-full p-2 border rounded-md"
            required
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition"
            disabled={loading}
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {trackingResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-bold text-lg">Order Status</h3>
            <div className="mt-2 space-y-2">
              <p><span className="font-semibold">Order ID:</span> {trackingResult.id}</p>
              <p><span className="font-semibold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  trackingResult.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  trackingResult.status === 'completed' ? 'bg-green-200 text-green-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {trackingResult.status}
                </span>
              </p>
              <p><span className="font-semibold">Pickup Time:</span> {trackingResult.pickupTime}</p>
              <p><span className="font-semibold">Items Count:</span> {trackingResult.itemsCount}</p>
              {trackingResult.instructions && (
                <p><span className="font-semibold">Instructions:</span> {trackingResult.instructions}</p>
              )}
              {trackingResult.createdAt && (
                <p><span className="font-semibold">Created At:</span> {trackingResult.createdAt.toDate().toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingAndTracking;