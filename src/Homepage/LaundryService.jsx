export default function LaundryService() {
  return (
    <div id="service" className="flex flex-col items-center text-center py-12 px-6 bg-white min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900">How Our Laundry Service Works</h2>
      <p className="text-gray-600 max-w-2xl mt-2">
        Having fresh, neatly folded laundry delivered right to your doorstep is as simple as 1-2-3!
      </p>
      
      <div className="flex flex-col md:flex-row gap-12 mt-7 w-full max-w-7xl">
        {[
          { step: "1", title: "Schedule", desc: "Select a convenient day and time any day of the week for your laundry pickup." },
          { step: "2", title: "Pickup", desc: "Set your bags of dirty laundry before your pickup time and we will pick them up right on schedule." },
          { step: "3", title: "Delivery", desc: "You can relax and take a load off! We’ll deliver your laundry expertly cleaned and folded right to your door!" },
        ].map((item, index) => (
          <div key={index} className="relative bg-pink-200 p-20 rounded-lg shadow-lg w-full md:w-1/3 flex flex-col items-center">
            <div className="absolute -top-5 bg-white text-pink-500 font-bold w-18 h-18 flex items-center justify-center rounded-full text-xl shadow-lg border-2 border-pink-500">
              {item.step}
            </div>
            <h3 className="mt-8 text-3xl font-bold text-gray-900">{item.title}</h3>
            <p className="text-gray-700 mt-2 text-l">{item.desc}</p>
          </div>
        ))}
      </div>

      <button className="mt-10 bg-pink-500 text-white font-semibold px-6 py-3 rounded-full shadow-md hover:bg-pink-600 transition">
        Schedule a Pickup
      </button>
      
      
    </div>
    
  );
}
