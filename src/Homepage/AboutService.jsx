import { useState } from "react";
import wash from "..src/assets/wash.png";
import dry from "../assets/Dry.png";
import Selfservice from "../assets/Selfservice.png";

const services = {
  "Wash & Fold": {
    title: "Wash & Fold",
    description:
      "If you're tired of laundry, our Wash & Fold service is ideal. We'll pick up your clothes, wash them according to your preferences in individual machines, fold them neatly, including matching your socks, and return them to you.Enjoy clean, folded laundry delivered to your door. We take care of the washing, so you can focus on what matters.",
    image: wash,
  },
  "Dry Cleaning": {
    title: "Dry Cleaning",
    description:
      "Get your delicate items professionally cleaned, pressed, and hung, all without leaving home. We handle dry cleaning and laundering for a crisp, ready-to-wear finish.Experience top-tier cleaning delivered to your door. We'll expertly clean and press your garments, returning them on hangers, saving you trips to the dry cleaners.",
    image: dry,
  },
  "Other Services": {
    title: "Self Service",
    
    
    description:
      "Discover the freedom of affordable and flexible laundry at our self-service location! We offer a range of easy-to-operate, high-efficiency machines at prices that won't strain your wallet. Customize your wash with your preferred detergents and fabric softeners, and tackle your laundry on your own schedule. Experience laundry done exactly to your liking, without the hefty price tag.",
    image: Selfservice,
  },
};

export default function AboutService ()  {
  const [selectedService, setSelectedService] = useState("Wash & Fold");

  return (
    <div>
    <div className="min-h-screen bg-white p-6">
     
  {/* Navigation */}
  <nav className="bg-pink-100 p-4 flex space-x-6 text-gray-700 font-semibold">
    {Object.keys(services).map((service) => (
      <button
        key={service}
        onClick={() => setSelectedService(service)}
        className={`px-4 py-2 transition duration-300 border-b-2 ${
          selectedService === service
            ? "border-pink-500 text-pink-600"
            : "border-transparent hover:border-gray-400"
        }`}
        aria-label={`Select ${service} service`} // Added aria-label for better accessibility
      >
        {service}
      </button>
    ))}
  </nav>

  {/* Content Section */}
  <div className="flex flex-col md:flex-row items-center mt-10 max-w-6xl mx-auto p-4">
    <div className="md:w-1/2">
      <h1 className="text-3xl font-bold mb-4">{services[selectedService].title}</h1>
      <p className="text-gray-600 mb-6 text-xl">{services[selectedService].description}</p>
    </div>
    <div className="md:w-1/2 mt-6 md:mt-0 flex justify-center">
      <img
        src={services[selectedService].image}
        alt={services[selectedService].title}
        className="w-full max-w-sm rounded-lg shadow-lg"
      />
    </div>
  </div>
</div>
</div>
  );
};
