import React, { useState, useEffect } from "react";
import { db } from "../../../firebase/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Package, DollarSign, Users, CreditCard, TrendingUp, PencilLine, Trash, Plus } from "lucide-react";

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    revenue: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    kilo: "",
    itemsCount: "",
    service: "Wash & fold",
    status: "pending"
  });

  // Fetch orders in real-time
  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = [];
      let total = 0;
      let pending = 0;
      let completed = 0;
      let revenue = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({ id: doc.id, ...data });
        
        total++;
        if (data.status === "pending") pending++;
        if (data.status === "completed") completed++;
        
        // Simple revenue calculation (example: ₱100 per kilo)
        revenue += (parseInt(data.kilo) || 0) * 100;
      });

      setOrders(ordersData);
      setStats({
        totalOrders: total,
        pendingOrders: pending,
        completedOrders: completed,
        revenue: revenue
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditOrder = (order) => {
    setCurrentOrder(order);
    setFormData({
      name: order.name || "",
      contact: order.contact || "",
      email: order.email || "",
      kilo: order.kilo || "",
      itemsCount: order.itemsCount || "",
      service: order.service || "Wash & fold",
      status: order.status || "pending"
    });
    setIsModalOpen(true);
  };

  const handleCreateOrder = () => {
    setCurrentOrder(null);
    setFormData({
      name: "",
      contact: "",
      email: "",
      kilo: "",
      itemsCount: "",
      service: "Wash & fold",
      status: "pending"
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const orderData = {
        ...formData,
        createdAt: currentOrder?.createdAt || new Date(),
        kilo: parseInt(formData.kilo) || 0,
        itemsCount: parseInt(formData.itemsCount) || 0
      };

      if (currentOrder) {
        // Update existing order
        await updateDoc(doc(db, "orders", currentOrder.id), orderData);
      } else {
        // Create new order
        await addDoc(collection(db, "orders"), orderData);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "washing": return "bg-blue-100 text-blue-800";
      case "drying": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Package size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Pending Orders</p>
              <p className="text-3xl font-bold">{stats.pendingOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Completed Orders</p>
              <p className="text-3xl font-bold">{stats.completedOrders}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Estimated Revenue</p>
              <p className="text-3xl font-bold">₱{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Orders</h2>
          <button 
            onClick={handleCreateOrder}
            className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
          >
            <Plus size={18} />
            Create Order
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of clothes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order, index) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.kilo || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.itemsCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.createdAt?.toDate?.().toLocaleDateString() || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.service}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <button 
                      onClick={() => handleEditOrder(order)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <PencilLine size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">
                {currentOrder ? "Edit Order" : "Create New Order"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact No.</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kilo</label>
                  <input
                    type="number"
                    name="kilo"
                    value={formData.kilo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">No. of clothes</label>
                  <input
                    type="number"
                    name="itemsCount"
                    value={formData.itemsCount}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Service</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="Wash & fold">Wash & fold</option>
                  <option value="Dry cleaning">Dry cleaning</option>
                  <option value="Ironing">Ironing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="washing">Washing</option>
                  <option value="drying">Drying</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;