import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Jackerbox",
  description: "Learn about how Jackerbox handles your data and privacy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="lead">
            Last updated: March 1, 2024
          </p>
          
          <p>
            At Jackerbox, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you visit our website or use our platform.
          </p>
          
          <h2>Information We Collect</h2>
          
          <p>
            We collect information that you provide directly to us when you:
          </p>
          
          <ul>
            <li>Create an account</li>
            <li>List equipment for rent</li>
            <li>Rent equipment from others</li>
            <li>Contact our customer support</li>
            <li>Subscribe to our newsletter</li>
            <li>Participate in surveys or promotions</li>
          </ul>
          
          <p>
            This information may include your name, email address, phone number, payment information,
            location data, and any other information you choose to provide.
          </p>
          
          <h2>How We Use Your Information</h2>
          
          <p>
            We use the information we collect to:
          </p>
          
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Communicate with you about products, services, offers, and events</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Personalize your experience on our platform</li>
          </ul>
          
          <h2>Sharing of Information</h2>
          
          <p>
            We may share your information with:
          </p>
          
          <ul>
            <li>Other users of the platform as necessary to facilitate your transactions</li>
            <li>Vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
            <li>Law enforcement agencies, government officials, or other third parties when we are compelled to do so by a subpoena, court order, or similar legal procedure</li>
          </ul>
          
          <h2>Your Choices</h2>
          
          <p>
            You can access and update certain information about yourself from your account settings.
            You may also opt out of receiving promotional communications from us by following the
            instructions in those communications.
          </p>
          
          <h2>Data Security</h2>
          
          <p>
            We take reasonable measures to help protect information about you from loss, theft, misuse,
            unauthorized access, disclosure, alteration, and destruction.
          </p>
          
          <h2>Changes to This Privacy Policy</h2>
          
          <p>
            We may change this Privacy Policy from time to time. If we make changes, we will notify you
            by revising the date at the top of the policy and, in some cases, we may provide you with
            additional notice.
          </p>
          
          <h2>Contact Us</h2>
          
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          
          <p>
            <strong>Email:</strong> privacy@jackerbox.com<br />
            <strong>Address:</strong> 123 Equipment Lane, Tool City, TC 12345
          </p>
        </div>
        
        <div className="mt-12 pt-8 border-t">
          <Link href="/" className="text-jacker-blue hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 