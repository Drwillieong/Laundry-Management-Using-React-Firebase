import React from "react";



 const AboutOurFees =() =>{
    return (

  <div className="bg-white ">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About our fees</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Service Fee Card */}
      <div className="border border-pink-300 rounded-xl p-6 shadow-md bg-white transition-transform transform hover:scale-105 hover:shadow-xl">
        <h3 className="text-xl font-semibold mb-2">Service Fee</h3>
        <p className="text-gray-700">
          28 pesos per kilo for regular clothes, or 199 pesos for 7 kilos or
          less. Detergent and fabric conditioner are included.
        </p>
      </div>

      {/* Free Pickup & Delivery Card */}
      <div className="border border-pink-300 rounded-xl p-6 shadow-md bg-white transition-transform transform hover:scale-105 hover:shadow-xl">
        <h3 className="text-xl font-semibold mb-2">FREE Pickup & Delivery</h3>
        <p className="text-gray-700">
          Free pickup/delivery (2+ loads) in Calamba: 7-10 AM & 5-7 PM.
          Covers listed barangays & nearby areas.
        </p>
      </div>

      {/* Payment Card */}
      <div className="border border-pink-300 rounded-xl p-6 shadow-md bg-white transition-transform transform hover:scale-105 hover:shadow-xl">
        <h3 className="text-xl font-semibold mb-2">Payment</h3>
        <p className="text-gray-700">
          We offer convenient payment options, accepting both cash and GCash, and
          payment is due upon pickup.
        </p>
      </div>
    </div>
  </div>
</div>
    );
 }

 export default AboutOurFees