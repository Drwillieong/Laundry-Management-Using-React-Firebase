import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import AboutService from "./AboutOurFees"; // Import LaundryService
import LaundryService from "./LaundryService"; // Import LaundrySection
import backgroundImage from "../assets/loundry BG.webp";
import SignUpModal from "./SignUpModal";
import AboutOurFees from "./AboutOurFees";

const HomePage = () => {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login'); // Navigate to the Log in component
  };

  return (
    <div className="bg-gray-100 min-h-screen">

  {/* Navbar */}
  <nav className="bg-pink-500 p-5 flex justify-between items-center text-white shadow-lg sticky top-0 z-10 ">
        <h1 className="text-3xl font-extrabold">Wash It Izzy</h1>
        <div className="space-x-6">
          <a href="#service" className="hover:underline font-bold">Service</a>
          <a href="#contact" className="hover:underline font-bold">Contact</a>
          <button onClick={handleLoginClick} className="bg-white text-pink-400 px-4 py-2 rounded-lg ml-0">Login</button>
        </div>
      </nav>

  {/* Hero Section */}
  <div
    className="items-center bg-cover bg-center py-24 px-4 sm:px-8 md:px-16 min-h-[80vh]"
    style={{ backgroundImage: `url(${backgroundImage})` }}
  >
    <div className="max-w-3xl z-10">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold italic text-white leading-tight">
        EVERY LAUNDRY MAKES A DIFFERENCE
      </h1>
      <p className="mt-4 text-base sm:text-lg text-white">
        We offer drop-off, self-service, pick-up & delivery, and dry-cleaning services to make laundry day Izzy-ier for you.
      </p>

      {/* CTA Button */}
      <div
        onClick={setShowSignUpModal}
        className="mt-6 flex rounded-full cursor-pointer bg-amber-50 w-[20rem] ">
        <div className="px-8 py-3 border-r text-black font-medium">Pickup <br /> Now?  </div>
        <div className="px-6 py-3 flex items-center text-black font-semibold">
          Where? <br /> Add address
          <span className="ml-2 w-12 h-12  bg-pink-500 text-white flex items-center justify-center rounded-full">
            ➝
          </span>
        </div>
      </div>  
    </div>
  </div>


    

      {/* Signup Modal */}
      <SignUpModal 
        showSignUpModal={showSignUpModal} 
        setShowSignUpModal={setShowSignUpModal} 
      />

    
      
      {/* Laundry Service and Sections */}
      <LaundryService />
      <AboutService />
      <AboutOurFees />


      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 mt-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Brand & About */}
          <div>
            <h3 className="text-xl font-bold">Wash It Izzy</h3>
            <p className="mt-2 text-gray-400">God will provide.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2">
              <li><a href="#services" className="text-gray-400 hover:text-white">Services</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Login</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold">Get in Touch</h4>
            <p className="mt-2 text-gray-400">Email: washitizzy@email.com</p>
            <p className="text-gray-400">Phone: 123456789</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-500 text-sm mt-8">
          &copy; 2025 Wash It Izzy - All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

export default HomePage;