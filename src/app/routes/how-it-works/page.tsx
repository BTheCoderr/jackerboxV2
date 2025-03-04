import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-jacker-blue">How Jackerbox Works</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-jacker-blue">For Renters</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-blue bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-blue">1</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Find Equipment</h3>
                <p className="text-gray-600">
                  Browse thousands of items available for rent in your area.
                  Filter by category, location, and price to find exactly what you need.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-blue bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-blue">2</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Book & Pay</h3>
                <p className="text-gray-600">
                  Reserve the equipment for the dates you need.
                  Secure payment through our platform ensures both parties are protected.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-blue bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-blue">3</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Pick Up & Use</h3>
                <p className="text-gray-600">
                  Meet the owner to pick up the equipment.
                  Use it for your project and return it in the same condition.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-blue bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-blue">4</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Return & Review</h3>
                <p className="text-gray-600">
                  Return the equipment to the owner at the agreed time.
                  Leave a review about your experience to help other renters.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href="/routes/equipment" 
              className="px-6 py-3 bg-jacker-blue text-white rounded-md hover:bg-opacity-90 inline-block"
            >
              Find Equipment
            </Link>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4 text-jacker-orange">For Equipment Owners</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-orange bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-orange">1</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">List Your Equipment</h3>
                <p className="text-gray-600">
                  Create detailed listings for your equipment with photos, descriptions, and pricing.
                  Set your availability and rental terms.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-orange bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-orange">2</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Approve Requests</h3>
                <p className="text-gray-600">
                  Review rental requests from potential renters.
                  Communicate with them through our messaging system.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-orange bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-orange">3</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Hand Over Equipment</h3>
                <p className="text-gray-600">
                  Meet the renter to hand over your equipment.
                  Ensure they understand how to use it properly.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-jacker-orange bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-jacker-orange">4</span>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Get Paid & Review</h3>
                <p className="text-gray-600">
                  Receive payment securely through our platform.
                  Leave a review for the renter after they return your equipment.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href="/routes/equipment/new" 
              className="px-6 py-3 bg-jacker-orange text-white rounded-md hover:bg-opacity-90 inline-block"
            >
              List Your Equipment
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-jacker-blue">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium mb-2">Is my equipment insured?</h3>
            <p className="text-gray-600">
              Jackerbox provides basic insurance coverage for all rentals. Equipment owners can also require a security deposit for additional protection.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">How do payments work?</h3>
            <p className="text-gray-600">
              Payments are processed securely through our platform. Renters pay when booking, and owners receive payment after the rental is completed successfully.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">What if the equipment is damaged?</h3>
            <p className="text-gray-600">
              If equipment is damaged during a rental, the renter is responsible for repair or replacement costs. Our insurance policy covers certain types of damage.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">Can I cancel a booking?</h3>
            <p className="text-gray-600">
              Yes, both renters and owners can cancel bookings. Cancellation policies vary depending on how close to the rental start date the cancellation occurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 