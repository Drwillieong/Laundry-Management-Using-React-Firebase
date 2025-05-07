import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../../../../firebase/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';



const ScheduleOrder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pickup');
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'cash',
    gcashNumber: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);

  // Booking form state
  const [formData, setFormData] = useState({
    serviceType: 'washFold',
    pickupDate: '',
    pickupTime: '7am-10am',
    loadCount: 1,
    instructions: '',
    status: 'pending',
    paymentMethod: 'cash'
  });

  

  // Available services
  const services = [
    {
      id: 'washFold',
      name: 'Wash & Fold',
      description: 'The perfect service for your everyday laundry needs.',
      price: 189,
      priceText: '₱189/load up to 7 kilos (Detergent and Fab Con INCLUDED)'
    },
   
  ];

  // Available pickup dates (next 7 days)
  const getPickupDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toISOString().split('T')[0]
      });
    }
    return dates;
  };

  // Fetch user data and orders
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setUserDataLoading(false);
        }

        // Set up orders listener
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
          const userOrders = [];
          querySnapshot.forEach((doc) => {
            userOrders.push({ id: doc.id, ...doc.data() });
          });
          setOrders(userOrders);
        });
        
        return () => unsubscribeOrders();
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  // Handle photo uploads
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photoFiles.length > 5) {
      alert('You can upload a maximum of 5 photos');
      return;
    }
    
    setPhotoFiles([...photoFiles, ...files]);
    
    // Create previews
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setPhotoPreviews([...photoPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    const newFiles = [...photoFiles];
    const newPreviews = [...photoPreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const uploadPhotosToStorage = async (orderId) => {
    if (photoFiles.length === 0) return [];
    
    setUploadingPhotos(true);
    const uploadedUrls = [];
    
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const storageRef = ref(storage, `orders/${orderId}/photos/${Date.now()}_${i}_${file.name}`);
        
        // Add metadata with content type
        const metadata = {
          contentType: file.type
        };
        
        // Use uploadBytes with metadata
        const snapshot = await uploadBytes(storageRef, file, metadata);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
    
    return uploadedUrls;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentDetails(prev => ({ ...prev, method }));
    setFormData(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickupDate) {
      alert('Please select a pickup date');
      return;
    }

    if (!userData || !userData.address) {
      alert('Please complete your profile information first');
      navigate('/account-setup');
      return;
    }

    try {
      setLoading(true);
      const selectedService = services.find(s => s.id === formData.serviceType);
      const totalPrice = selectedService.price * formData.loadCount;
      
      // Construct address from parts if fullAddress doesn't exist
      const userAddress = userData.address.fullAddress || 
        `${userData.address.street || ''}, ${userData.address.blockLot ? `Block ${userData.address.blockLot}, ` : ''}${userData.address.barangay || ''}, Calamba City`;

      // First create the order document to get an ID
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...formData,
        userId: user.uid,
        userName: user.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        userEmail: user.email || '',
        userAddress,
        userContact: userData.contact || '',
        totalPrice,
        createdAt: new Date(),
        status: 'pending',
        serviceName: selectedService.name,
        photos: [], // Will be updated after upload
        paymentDetails: paymentDetails.method === 'cash' ? null : {
          method: paymentDetails.method,
          status: 'pending',
          ...(paymentDetails.method === 'gcash' && { 
            reference: `GCASH-${Date.now()}`,
            gcashNumber: paymentDetails.gcashNumber || ''
          }),
          ...(paymentDetails.method === 'card' && { 
            last4: paymentDetails.cardNumber?.slice(-4) || '',
            expiry: paymentDetails.expiry || ''
          })
        }
      });

      try {
        // Upload photos and update the order with photo URLs
        if (photoFiles.length > 0) {
          const photoUrls = await uploadPhotosToStorage(orderRef.id);
          await updateDoc(orderRef, { photos: photoUrls });
        }
      } catch (uploadError) {
        console.error('Photo upload failed:', uploadError);
        // Continue even if photo upload fails
      }

      // If payment is not cash, show payment modal
      if (formData.paymentMethod !== 'cash') {
        setShowPaymentModal(true);
      } else {
        alert('Booking submitted successfully! Our team will review your request.');
        resetForm();
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert(error.message || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would:
      // 1. Verify the GCash payment with your payment provider
      // 2. Update the order status to 'paid' or 'approved'
      
      alert('Payment processed successfully! Our team will review your request.');
      setShowPaymentModal(false);
      resetForm();
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      serviceType: order.serviceType,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      loadCount: order.loadCount,
      instructions: order.instructions,
      paymentMethod: order.paymentMethod,
      status: order.status
    });
    setActiveTab('pickup');
  };

  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        setLoading(true);
        await updateDoc(doc(db, 'orders', orderId), { 
          status: 'cancelled',
          cancelledAt: new Date()
        });
        alert('Order cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: 'washFold',
      pickupDate: '',
      pickupTime: '7am-10am',
      loadCount: 1,
      instructions: '',
      status: 'pending',
      paymentMethod: 'cash'
    });
    setPaymentDetails({
      method: 'cash',
      gcashNumber: '',
      cardNumber: '',
      expiry: '',
      cvv: ''
    });
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setEditingOrder(null);
  };

  if (userDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-pink-600"></div>
          <p className="mt-2">Loading your profile information...</p>
        </div>
      </div>
    );
  }

  if (!userData || !userData.address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Profile Incomplete</h2>
          <p className="mb-4">Please complete your profile information before booking.</p>
          <button
            onClick={() => navigate('/account-setup')}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-600 mb-8">Laundry Booking</h1>
        
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'pickup' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('pickup')}
          >
            Schedule a Pickup
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'orders' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </button>
        </div>

        {/* Pickup Form */}
        {activeTab === 'pickup' && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Choose Your Service</h2>
              <div className="space-y-4">
                {services.map(service => (
                  <div 
                    key={service.id} 
                    className={`p-4 border rounded-lg cursor-pointer ${formData.serviceType === service.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                    onClick={() => setFormData(prev => ({ ...prev, serviceType: service.id }))}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        id={service.id}
                        name="serviceType"
                        checked={formData.serviceType === service.id}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <label htmlFor={service.id} className="font-medium">{service.name}</label>
                        <p className="text-sm text-gray-600">{service.description}</p>
                        <p className="text-sm text-pink-600 mt-1">{service.priceText}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Pickup Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {getPickupDates().map((date) => (
                      <button
                        key={date.fullDate}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, pickupDate: date.fullDate }))}
                        className={`py-2 text-center rounded ${formData.pickupDate === date.fullDate ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <div className="text-xs">{date.day}</div>
                        <div className="font-medium">{date.date}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
                  <select
                    name="pickupTime"
                    value={formData.pickupTime}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  >
                    <option value="7am-10am">Morning (7am-10am)</option>
                    <option value="5pm-7pm">Afternoon (5pm-7pm)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    We'll contact you 30 minutes before arrival
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Loads *</label>
                  <select
                    name="loadCount"
                    value={formData.loadCount}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  >
                    <option value="1">1 load (max 7kg)</option>
                    <option value="2">2 loads (max 14kg)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum of 2 loads per booking
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('cash')}
                      className={`p-2 text-center text-sm rounded ${paymentDetails.method === 'cash' ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('gcash')}
                      className={`p-2 text-center text-sm rounded ${paymentDetails.method === 'gcash' ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      GCash
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('card')}
                      className={`p-2 text-center text-sm rounded ${paymentDetails.method === 'card' ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      Card
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Photos of Your Laundry (Optional)
                <span className="text-xs text-gray-500 ml-1">Max 5 photos</span>
              </label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none">
                  <span>Select photos</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-gray-500 ml-2">
                  {photoFiles.length} {photoFiles.length === 1 ? 'photo' : 'photos'} selected
                </p>
              </div>
              
              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Laundry preview ${index + 1}`}
                        className="h-20 w-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-pink-500 focus:ring-pink-500"
                placeholder="Any special instructions for your laundry..."
              ></textarea>
            </div>

            <div className="bg-pink-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-pink-800 mb-2">Service Notes:</h3>
              <ul className="list-disc list-inside text-sm text-pink-700 space-y-1">
                <li>Free pickup and delivery for selected barangays</li>
                <li>Other areas may have minimum fee</li>
                <li>Payment upon pickup for cash payments</li>
                <li>Contact us at 0968-856-3288 for questions</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.pickupDate || uploadingPhotos}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50"
            >
              {(loading || uploadingPhotos) ? 'Processing...' : editingOrder ? 'Update Order' : 'Confirm Pickup'}
            </button>
          </div>
        )}

        {/* Orders List */}
        {activeTab === 'orders' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">My Orders</h2>
            </div>
            {orders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                You don't have any orders yet.
              </div>
            ) : (
              <div className="divide-y">
                {orders.map(order => (
                  <div key={order.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{services.find(s => s.id === order.serviceType)?.name || 'Service'}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.pickupDate).toLocaleDateString()} • {order.pickupTime}
                        </p>
                        <p className="text-sm text-gray-600">{order.loadCount} load(s) • ₱{order.totalPrice}</p>
                        <p className="text-sm text-gray-600">Payment: {order.paymentMethod === 'cash' ? 'Cash on pickup' : order.paymentMethod === 'gcash' ? 'GCash' : 'Credit/Debit Card'}</p>
                        <p className="text-sm text-gray-600">Status: 
                          <span className={`ml-1 ${
                            order.status === 'completed' ? 'text-green-600' : 
                            order.status === 'cancelled' ? 'text-red-600' : 
                            order.status === 'approved' ? 'text-blue-600' : 'text-yellow-600'
                          }`}>
                            {order.status}
                          </span>
                        </p>
                        {order.instructions && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Instructions:</span> {order.instructions}
                          </p>
                        )}
                        {order.photos && order.photos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-600">Item Photos:</p>
                            <div className="flex gap-2 mt-1">
                              {order.photos.map((photo, index) => (
                                <a 
                                  key={index} 
                                  href={photo} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img 
                                    src={photo} 
                                    alt={`Laundry item ${index + 1}`}
                                    className="h-12 w-12 object-cover rounded"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEdit(order)}
                              className="text-sm bg-pink-100 text-pink-600 px-3 py-1 rounded hover:bg-pink-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancel(order.id)}
                              className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'approved' && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
              
              {paymentDetails.method === 'gcash' && (
                <div className="mb-6">
                  <p className="mb-4">Please send your payment via GCash using the following details:</p>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">GCash Number:</span>
                      <span>0968-856-3288</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Amount:</span>
                      <span>₱{formData.loadCount * services.find(s => s.id === formData.serviceType).price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reference:</span>
                      <span>WASHIT-{Date.now().toString().slice(-6)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your GCash Number (Optional)</label>
                    <input
                      type="text"
                      name="gcashNumber"
                      value={paymentDetails.gcashNumber}
                      onChange={handlePaymentChange}
                      placeholder="09XX XXX XXXX"
                      className="w-full p-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Providing your GCash number helps us verify your payment faster
                    </p>
                  </div>
                  
                  <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      After payment, please wait for our confirmation message. Your booking will be approved once payment is verified.
                    </p>
                  </div>
                </div>
              )}
              
              {paymentDetails.method === 'card' && (
                <div className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-2 border rounded-md"
                        maxLength="16"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          name="expiry"
                          value={paymentDetails.expiry}
                          onChange={handlePaymentChange}
                          placeholder="MM/YY"
                          className="w-full p-2 border rounded-md"
                          maxLength="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={paymentDetails.cvv}
                          onChange={handlePaymentChange}
                          placeholder="123"
                          className="w-full p-2 border rounded-md"
                          maxLength="3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleOrder;