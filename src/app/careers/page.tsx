import React from "react";
import { Metadata } from "next";
import Link from "next/link";
// Import the hot-reload helper
import setupHotReload from "../hot-reload";

// This helps with hot reloading
setupHotReload();

export const metadata: Metadata = {
  title: "Careers | Jackerbox",
  description: "Join our team at Jackerbox and help revolutionize equipment rental",
};

export default function CareersPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Careers at Jackerbox</h1>
        
        <div className="bg-blue-50 p-8 rounded-lg mb-10">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-lg mb-6">
            We're working on building our careers page. Check back soon for exciting opportunities to join our team!
          </p>
          <p className="text-lg mb-8">
            At Jackerbox, we're on a mission to revolutionize the equipment rental industry. We're always looking for talented individuals who are passionate about creating innovative solutions.
          </p>
          
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/about"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Learn About Us
            </Link>
            <Link
              href="/contact"
              className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Why Work With Us?</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p>
                Work on cutting-edge technology and help shape the future of equipment rental.
              </p>
            </div>
            
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Great Team</h3>
              <p>
                Join a diverse and talented team passionate about making a difference.
              </p>
            </div>
            
            <div className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Growth</h3>
              <p>
                Develop your skills and grow your career in a supportive environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 