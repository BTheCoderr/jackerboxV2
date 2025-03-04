import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-gray-600 mb-4">
              Don't buy it, rent it. Rent equipment from people in your area or make money renting out your gear.
            </p>
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Jackerbox. All rights reserved.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 text-jacker-blue">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/routes/equipment" className="text-gray-600 hover:text-jacker-blue">
                  Browse Equipment
                </Link>
              </li>
              <li>
                <Link href="/routes/equipment/new" className="text-gray-600 hover:text-jacker-blue">
                  List Your Equipment
                </Link>
              </li>
              <li>
                <Link href="/routes/rentals" className="text-gray-600 hover:text-jacker-blue">
                  My Rentals
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 text-jacker-blue">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-jacker-blue">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-jacker-blue">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 hover:text-jacker-blue">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 text-jacker-blue">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-jacker-blue">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-jacker-blue">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-jacker-blue">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 