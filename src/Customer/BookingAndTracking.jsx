import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Modal from 'react-modal';

// Set modal styles
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '600px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
};

Modal.setAppElement('#root');

const BookingAndTracking = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [bookingData, setBookingData] = useState({
    name: "",
    contact: "",
    address: "",
    landmark: "",
    pickupDate: "",
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
  const [userOrders, setUserOrders] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

  // Generate a 5-digit alphanumeric order ID
  const generateShortOrderId = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getMinDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  // Set up real-time listener for user orders
  useEffect(() => {
    let unsubscribeOrders = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
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

          // Set up real-time listener for user's orders
          const q = query(collection(db, "orders"), where("userId", "==", user.uid));
          unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
            const orders = [];
            querySnapshot.forEach((doc) => {
              orders.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date (newest first)
            orders.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
            setUserOrders(orders);
          });

        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders();
    };
  }, [navigate]);

  // Set up real-time listener for tracking
  useEffect(() => {
    if (!trackingId) return;

    const q = query(collection(db, "orders"), where("orderId", "==", trackingId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          setTrackingResult({ id: doc.id, ...doc.data() });
        });
      } else {
        setTrackingResult(null);
      }
    });

    return () => unsubscribe();
  }, [trackingId]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const shortOrderId = generateShortOrderId();
      const bookingWithTimestamp = {
        ...bookingData,
        orderId: shortOrderId,
        createdAt: new Date(),
        itemsCount: parseInt(bookingData.itemsCount),
        userId: auth.currentUser?.uid
      };

      await addDoc(collection(db, "orders"), bookingWithTimestamp);
      
      alert(`Booking successful! Your order ID is: ${shortOrderId}`);
      setBookingData(prev => ({
        ...prev,
        landmark: "",
        pickupDate: "",
        pickupTime: "9am-10am",
        itemsCount: "",
        instructions: "",
      }));
      setTrackingId(shortOrderId);
    } catch (error) {
      console.error("Error adding booking:", error);
      alert("Error creating booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setLoading(true);
    // Tracking is now handled by the real-time listener
    setLoading(false);
  };

  const handleEditOrder = (order) => {
    setEditingOrderId(order.id);
    setBookingData({
      name: order.name,
      contact: order.contact,
      address: order.address,
      landmark: order.landmark || "",
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      itemsCount: order.itemsCount.toString(),
      instructions: order.instructions || "",
      status: order.status,
      userId: order.userId,
      createdAt: order.createdAt
    });
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "orders", editingOrderId), {
        ...bookingData,
        itemsCount: parseInt(bookingData.itemsCount),
        pickupDate: bookingData.pickupDate,
        pickupTime: bookingData.pickupTime
      });
      
      alert("Order updated successfully!");
      setEditingOrderId(null);
      setBookingData({
        name: "",
        contact: "",
        address: "",
        landmark: "",
        pickupDate: "",
        pickupTime: "9am-10am",
        itemsCount: "",
        instructions: "",
        status: "pending",
        userId: auth.currentUser?.uid || "",
        createdAt: null
      });
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
        alert("Order cancelled successfully!");
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert("Error cancelling order. Please try again.");
      }
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedOrder(null);
  };

  const toggleShowAllOrders = () => {
    setShowAllOrders(!showAllOrders);
  };

  // Filter orders based on showAllOrders state
  const displayedOrders = showAllOrders ? userOrders : userOrders.slice(0, 5);

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
        <h2 className="text-2xl font-semibold text-center text-pink-400">
          {editingOrderId ? "Edit Your Booking" : "Book a Laundry Pickup"}
        </h2>
        <form 
          className="mt-4 space-y-4" 
          onSubmit={editingOrderId ? handleUpdateOrder : handleBookingSubmit}
        >
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <input
                type="date"
                name="pickupDate"
                value={bookingData.pickupDate}
                onChange={handleBookingChange}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
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
            </div>
          </div>
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
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-pink-400 text-white p-2 rounded-md hover:bg-pink-600 transition"
              disabled={loading}
            >
              {loading ? "Processing..." : editingOrderId ? "Update Booking" : "Submit Booking"}
            </button>
            {editingOrderId && (
              <button
                type="button"
                onClick={() => {
                  setEditingOrderId(null);
                  setBookingData({
                    name: "",
                    contact: "",
                    address: "",
                    landmark: "",
                    pickupDate: "",
                    pickupTime: "9am-10am",
                    itemsCount: "",
                    instructions: "",
                    status: "pending",
                    userId: auth.currentUser?.uid || "",
                    createdAt: null
                  });
                }}
                className="flex-1 bg-gray-400 text-white p-2 rounded-md hover:bg-gray-500 transition"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* My Orders Section */}
      {userOrders.length > 0 && (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-center text-blue-500">My Orders</h2>
            {userOrders.length > 5 && (
              <button
                onClick={toggleShowAllOrders}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                {showAllOrders ? "Show Less" : "Show All"}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderId || order.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.pickupDate} at {order.pickupTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.itemsCount} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        order.status === 'approved' ? 'bg-blue-200 text-blue-800' :
                        order.status === 'completed' ? 'bg-green-200 text-green-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <p><span className="font-semibold">Order ID:</span> {trackingResult.orderId || trackingResult.id.substring(0, 8)}</p>
              <p><span className="font-semibold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  trackingResult.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  trackingResult.status === 'approved' ? 'bg-blue-200 text-blue-800' :
                  trackingResult.status === 'completed' ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {trackingResult.status}
                </span>
              </p>
              <p><span className="font-semibold">Pickup Date:</span> {trackingResult.pickupDate} at {trackingResult.pickupTime}</p>
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

      {/* Order Details Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Order Details"
      >
        {selectedOrder && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Order Details</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">Order ID:</span> {selectedOrder.orderId || selectedOrder.id.substring(0, 8)}</p>
              <p><span className="font-semibold">Customer:</span> {selectedOrder.name}</p>
              <p><span className="font-semibold">Contact:</span> {selectedOrder.contact}</p>
              <p><span className="font-semibold">Address:</span> {selectedOrder.address}</p>
              {selectedOrder.landmark && <p><span className="font-semibold">Landmark:</span> {selectedOrder.landmark}</p>}
              <p><span className="font-semibold">Pickup Date:</span> {selectedOrder.pickupDate} at {selectedOrder.pickupTime}</p>
              <p><span className="font-semibold">Items Count:</span> {selectedOrder.itemsCount}</p>
              {selectedOrder.instructions && (
                <p><span className="font-semibold">Instructions:</span> {selectedOrder.instructions}</p>
              )}
              <p>
                <span className="font-semibold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedOrder.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  selectedOrder.status === 'approved' ? 'bg-blue-200 text-blue-800' :
                  selectedOrder.status === 'completed' ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {selectedOrder.status}
                </span>
              </p>
              {selectedOrder.createdAt && (
                <p><span className="font-semibold">Created At:</span> {selectedOrder.createdAt.toDate().toLocaleString()}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingAndTracking;