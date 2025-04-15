import React from "react";

const BookingAndTracking = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar */}
      <nav className="bg-pink-500 p-5 flex justify-between items-center text-white shadow-lg">
      <h1 className="text-4xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <a href="/" className="hover:underline font-bold">Home</a>
         
        </div>
      </nav>

      {/* Booking Form Section */}
      <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-pink-400">Book a Laundry Pickup</h2>
        <form className="mt-4 space-y-4">
          <input type="text" placeholder="Name" className="w-full p-2 border rounded-md" required />
          <input type="tel" placeholder="Contact Number" className="w-full p-2 border rounded-md" required />
          <input type="text" placeholder="Address" className="w-full p-2 border rounded-md" required />
          <input type="text" placeholder="Landmark (Optional)" className="w-full p-2 border rounded-md" />
          <select className="w-full p-2 border rounded-md" required>
            <option>Pickup Time: Morning</option>
            <option>Pickup Time: Afternoon</option>
            <option>Pickup Time: Evening</option>
          </select>
          <input type="number" placeholder="Number of Clothes" className="w-full p-2 border rounded-md" required />
          <textarea placeholder="Special Instructions" className="w-full p-2 border rounded-md"></textarea>
          <button type="submit" className="w-full bg-pink-400 text-white p-2 rounded-md">Submit Booking</button>
        </form>
      </div>

      {/* Order Tracking Section */}
      <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-green-500">Track Your Order</h2>
        <form className="mt-4 space-y-4">
          <input type="text" placeholder="Enter Order Number" className="w-full p-2 border rounded-md" required />
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded-md">Track Order</button>
        </form>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 mt-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold">Wash It Izzy</h3>
            <p className="mt-2 text-gray-400">God will provide.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white">Home</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Get in Touch</h4>
            <p className="mt-2 text-gray-400">Email: washitizzy@email.com</p>
            <p className="text-gray-400">Phone: 123456789</p>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm mt-8">
          &copy; 2025 Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default BookingAndTracking;
