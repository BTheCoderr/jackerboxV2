import { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us | Jackerbox",
  description: "Get in touch with the Jackerbox team for support or inquiries",
};

export default function ContactPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-lg mb-6">
              Have questions, feedback, or need assistance? We're here to help! Fill out the form
              and our team will get back to you as soon as possible.
            </p>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Our Office</h2>
              <address className="not-italic">
                123 Equipment Lane<br />
                Tool City, TC 12345<br />
                United States
              </address>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="mb-2">
                <strong>General Inquiries:</strong><br />
                <a href="mailto:info@jackerbox.com" className="text-jacker-blue hover:underline">
                  info@jackerbox.com
                </a>
              </p>
              <p className="mb-2">
                <strong>Support:</strong><br />
                <a href="mailto:support@jackerbox.com" className="text-jacker-blue hover:underline">
                  support@jackerbox.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong><br />
                <a href="tel:+15551234567" className="text-jacker-blue hover:underline">
                  (555) 123-4567
                </a>
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-3">Business Hours</h2>
              <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
              <p>Saturday: 10:00 AM - 4:00 PM EST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium">How do I list my equipment for rent?</h3>
              <p className="text-gray-600 mt-2">
                To list your equipment, sign in to your account, click on "List Equipment" in the navigation
                menu, and follow the prompts to create your listing with photos, description, and pricing.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium">How does the payment process work?</h3>
              <p className="text-gray-600 mt-2">
                Payments are processed securely through our platform. Renters pay when booking, and owners
                receive payment 24 hours after the rental period begins, minus our service fee.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium">What if the equipment is damaged during rental?</h3>
              <p className="text-gray-600 mt-2">
                We have a security deposit system and a claims process. If equipment is damaged, the owner
                can submit a claim within 48 hours of the rental return, and we'll help resolve the issue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 