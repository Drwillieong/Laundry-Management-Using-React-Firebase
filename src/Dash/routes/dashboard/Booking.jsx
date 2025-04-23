import React, { useState, useEffect } from "react";
import { db } from "../../../firebase/firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Modal from 'react-modal';

// Initialize calendar localizer
const localizer = momentLocalizer(moment);

// Set modal styles
const customStyles = {
  content: {
    inset: '5%', // gives space from the top, bottom, left, right
    padding: 0,
    border: 'none',
    borderRadius: '0.5rem',
    maxWidth: '60vw',
    width: '60%',
    maxHeight: '90vh',
    overflowY: 'auto', // 👈 this enables vertical scrolling
    margin: '0 auto',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
};

Modal.setAppElement('#root');

const Booking = () => {
  const navigate = useNavigate();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newBooking, setNewBooking] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    pickupDate: "",
    pickupTime: "9am-10am",
    itemsCount: "",
    itemsDetails: "",
    serviceType: "wash-dry-fold",
    instructions: "",
    status: "approved"
  });

  // Service type options
  const serviceTypes = [
    { value: "wash-dry-fold", label: "Wash, Dry & Fold" },
    { value: "dry-clean", label: "Dry Cleaning" },
    { value: "iron-only", label: "Iron Only" },
    { value: "special-care", label: "Special Care" }
  ];

  // Set up real-time listeners
  useEffect(() => {
    const pendingQuery = query(collection(db, "orders"), where("status", "==", "pending"));
    const approvedQuery = query(collection(db, "orders"), where("status", "==", "approved"));

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const pendingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingBookings(pendingData);
    });

    const unsubscribeApproved = onSnapshot(approvedQuery, (snapshot) => {
      const approvedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApprovedBookings(approvedData);
      setLoading(false);
    });

    return () => {
      unsubscribePending();
      unsubscribeApproved();
    };
  }, []);

  const handleApproveBooking = async (bookingId) => {
    try {
      await updateDoc(doc(db, "orders", bookingId), { status: "approved" });
      alert("Booking approved successfully!");
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking");
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to reject this booking?")) {
      try {
        await updateDoc(doc(db, "orders", bookingId), { status: "rejected" });
        alert("Booking rejected successfully!");
      } catch (error) {
        console.error("Error rejecting booking:", error);
        alert("Failed to reject booking");
      }
    }
  };

  const handleNewBookingChange = (e) => {
    const { name, value } = e.target;
    setNewBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const bookingWithTimestamp = {
        ...newBooking,
        createdAt: new Date(),
        itemsCount: parseInt(newBooking.itemsCount),
        userId: "admin"
      };

      await addDoc(collection(db, "orders"), bookingWithTimestamp);
      alert("Booking created successfully!");
      closeModal();
      resetForm();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Error creating booking");
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const resetForm = () => {
    setNewBooking({
      name: "",
      contact: "",
      email: "",
      address: "",
      pickupDate: "",
      pickupTime: "9am-10am",
      itemsCount: "",
      itemsDetails: "",
      serviceType: "wash-dry-fold",
      instructions: "",
      status: "approved"
    });
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const closeDetailsModal = () => {
    setSelectedBooking(null);
  };

  // Convert bookings to calendar events
  const calendarEvents = approvedBookings.map(booking => {
    const [startHour, endHour] = booking.pickupTime.includes('am') ? 
      booking.pickupTime.replace('am', '').split('-').map(t => parseInt(t)) :
      booking.pickupTime.replace('pm', '').split('-').map(t => parseInt(t) + 12);
    
    const startDate = new Date(booking.pickupDate);
    startDate.setHours(startHour);
    
    const endDate = new Date(booking.pickupDate);
    endDate.setHours(endHour);
    
    return {
      title: `${booking.name} - ${booking.serviceType}`,
      start: startDate,
      end: endDate,
      allDay: false,
      resource: booking
    };
  });

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
      Laundry Bookings
    </h1>
    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 w-full sm:w-auto">
      <button
        onClick={() => setCalendarView(!calendarView)}
        className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        {calendarView ? "List View" : "Calendar View"}
      </button>
      <button
        onClick={openModal}
        className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
      >
        Create New Booking
      </button>
    </div>
  </div>



      {calendarView ? (
        <div className="bg-white p-6 rounded-lg shadow-md h-[700px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={(event) => handleViewDetails(event.resource)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Approved Bookings */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center text-green-500 mb-6">Approved Bookings</h2>
            
            {approvedBookings.length === 0 ? (
              <p className="text-center text-gray-500">No approved bookings yet</p>
            ) : (
              <div className="space-y-4">
                {approvedBookings.map(booking => (
                  <div key={booking.id} className="border p-4 rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{booking.name}</h3>
                        <p><span className="font-semibold">Service:</span> {
                          serviceTypes.find(s => s.value === booking.serviceType)?.label || booking.serviceType
                        }</p>
                        <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                      </div>
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Section - Pending Bookings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center text-yellow-500 mb-6">Pending Approval</h2>
            
            {pendingBookings.length === 0 ? (
              <p className="text-center text-gray-500">No pending bookings</p>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map(booking => (
                  <div key={booking.id} className="border p-4 rounded-lg hover:bg-gray-50">
                    <h3 className="font-bold text-lg">{booking.name}</h3>
                    <p><span className="font-semibold">Service:</span> {
                      serviceTypes.find(s => s.value === booking.serviceType)?.label || booking.serviceType
                    }</p>
                    <p><span className="font-semibold">Pickup:</span> {booking.pickupDate} at {booking.pickupTime}</p>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => handleApproveBooking(booking.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Create New Booking"
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Create New Booking</h2>
            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  name="name"
                  value={newBooking.name}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contact"
                  value={newBooking.contact}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newBooking.email}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  name="serviceType"
                  value={newBooking.serviceType}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {serviceTypes.map(service => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <input
                  type="date"
                  name="pickupDate"
                  value={newBooking.pickupDate}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                <select
                  name="pickupTime"
                  value={newBooking.pickupTime}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="9am-10am">9:00 AM - 10:00 AM</option>
                  <option value="10am-11am">10:00 AM - 11:00 AM</option>
                  <option value="11am-12pm">11:00 AM - 12:00 PM</option>
                  <option value="3pm-4pm">3:00 PM - 4:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Items</label>
                <input
                  type="number"
                  name="itemsCount"
                  value={newBooking.itemsCount}
                  onChange={handleNewBookingChange}
                  className="w-full p-2 border rounded-md"
                  required
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={newBooking.address}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items Details</label>
              <textarea
                name="itemsDetails"
                value={newBooking.itemsDetails}
                onChange={handleNewBookingChange}
                placeholder="List of items (e.g., 5 shirts, 3 pants)"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                name="instructions"
                value={newBooking.instructions}
                onChange={handleNewBookingChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={closeModal}
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Create Booking
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onRequestClose={closeDetailsModal}
        style={customStyles}
        contentLabel="Booking Details"
      >
        {selectedBooking && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Booking Details</h2>
              <button onClick={closeDetailsModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">Customer:</span> {selectedBooking.name}</p>
              <p><span className="font-semibold">Contact:</span> {selectedBooking.contact}</p>
              {selectedBooking.email && <p><span className="font-semibold">Email:</span> {selectedBooking.email}</p>}
              <p><span className="font-semibold">Service Type:</span> {
                serviceTypes.find(s => s.value === selectedBooking.serviceType)?.label || selectedBooking.serviceType
              }</p>
              <p><span className="font-semibold">Pickup Date:</span> {selectedBooking.pickupDate}</p>
              <p><span className="font-semibold">Pickup Time:</span> {selectedBooking.pickupTime}</p>
              <p><span className="font-semibold">Address:</span> {selectedBooking.address}</p>
              <p><span className="font-semibold">Items Count:</span> {selectedBooking.itemsCount}</p>
              {selectedBooking.itemsDetails && (
                <p><span className="font-semibold">Items Details:</span> {selectedBooking.itemsDetails}</p>
              )}
              {selectedBooking.instructions && (
                <p><span className="font-semibold">Instructions:</span> {selectedBooking.instructions}</p>
              )}
              <p>
                <span className="font-semibold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedBooking.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  selectedBooking.status === 'approved' ? 'bg-green-200 text-green-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {selectedBooking.status}
                </span>
              </p>
              <p><span className="font-semibold">Created At:</span> {
                selectedBooking.createdAt?.toDate?.()?.toLocaleString() || 'N/A'
              }</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeDetailsModal}
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

export default Booking;