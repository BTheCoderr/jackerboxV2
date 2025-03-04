import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Jackerbox",
  description: "Learn about Jackerbox, our mission, and the team behind the platform",
};

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About Jackerbox</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-10">
          <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
          <p className="text-lg mb-4">
            At Jackerbox, we're on a mission to revolutionize the way people access and share
            equipment. We believe that everyone should have access to the tools they need,
            when they need them, without the burden of ownership.
          </p>
          <p className="text-lg">
            By connecting equipment owners with those who need to rent, we're creating a more
            sustainable, efficient, and collaborative economy. Our platform makes it easy to
            find, rent, and list equipment of all kinds, from professional gear to everyday tools.
          </p>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Our Story</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="mb-4">
                Jackerbox was founded in 2023 by a team of entrepreneurs who recognized a simple
                problem: people often need equipment for short periods but don't want to buy it
                outright, while others own equipment that sits unused most of the time.
              </p>
              <p>
                What started as a simple idea has grown into a comprehensive platform that serves
                thousands of users across the country. We're proud to have facilitated countless
                successful rentals, helping people access the equipment they need while enabling
                owners to earn extra income from their underutilized assets.
              </p>
            </div>
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
              <p className="text-gray-500 italic">Company timeline image</p>
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p>
                We're constantly looking for new ways to improve our platform and create better
                experiences for our users.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p>
                We believe in the power of community and strive to create connections between
                equipment owners and renters.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
              <p>
                By enabling equipment sharing, we're helping reduce waste and promoting a more
                sustainable approach to equipment usage.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <p className="text-gray-500 italic text-sm">Photo</p>
                </div>
                <h3 className="text-xl font-semibold mb-1">Team Member {i}</h3>
                <p className="text-blue-600 mb-3">Co-Founder & Role</p>
                <p className="text-gray-600">
                  Brief bio about the team member and their background.
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
          <p className="text-lg mb-6">
            Whether you're looking to rent equipment or share your own, we'd love to have you
            join our growing community of equipment enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/routes/browse"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Browse Equipment
            </Link>
            <Link
              href="/routes/equipment/new"
              className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              List Your Equipment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 