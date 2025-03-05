import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Jackerbox",
  description: "Read the terms and conditions for using the Jackerbox platform",
};

export default function TermsOfServicePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="lead">
            Last updated: March 1, 2024
          </p>
          
          <p>
            Please read these Terms of Service ("Terms") carefully before using the Jackerbox platform.
          </p>
          
          <h2>Acceptance of Terms</h2>
          
          <p>
            By accessing or using our service, you agree to be bound by these Terms. If you disagree
            with any part of the terms, then you may not access the service.
          </p>
          
          <h2>Description of Service</h2>
          
          <p>
            Jackerbox is a peer-to-peer equipment rental marketplace that connects equipment owners
            with people who want to rent equipment. We provide a platform for users to list, discover,
            and rent equipment.
          </p>
          
          <h2>User Accounts</h2>
          
          <p>
            When you create an account with us, you must provide information that is accurate, complete,
            and current at all times. Failure to do so constitutes a breach of the Terms, which may result
            in immediate termination of your account on our service.
          </p>
          
          <p>
            You are responsible for safeguarding the password that you use to access the service and for
            any activities or actions under your password.
          </p>
          
          <h2>Equipment Listings</h2>
          
          <p>
            As an equipment owner, you are responsible for:
          </p>
          
          <ul>
            <li>Providing accurate descriptions and images of your equipment</li>
            <li>Setting reasonable rental rates and security deposits</li>
            <li>Ensuring your equipment is in good working condition and safe to use</li>
            <li>Complying with all applicable laws and regulations</li>
          </ul>
          
          <p>
            Jackerbox reserves the right to remove any listing that violates these Terms or that we
            determine, in our sole discretion, is harmful to our community.
          </p>
          
          <h2>Rental Transactions</h2>
          
          <p>
            As a renter, you are responsible for:
          </p>
          
          <ul>
            <li>Using the equipment only for its intended purpose</li>
            <li>Returning the equipment in the same condition you received it</li>
            <li>Paying for any damage that occurs during your rental period</li>
            <li>Complying with all applicable laws and regulations</li>
          </ul>
          
          <h2>Fees and Payments</h2>
          
          <p>
            Jackerbox charges a service fee for each completed rental transaction. The fee is calculated
            as a percentage of the total rental amount and is clearly displayed before you confirm a
            transaction.
          </p>
          
          <p>
            All payments are processed through our secure payment system. We do not store your payment
            information on our servers.
          </p>
          
          <h2>Limitation of Liability</h2>
          
          <p>
            In no event shall Jackerbox, nor its directors, employees, partners, agents, suppliers, or
            affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
            resulting from your access to or use of or inability to access or use the service.
          </p>
          
          <h2>Changes to Terms</h2>
          
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material we will try to provide at least 30 days' notice prior to any new
            terms taking effect.
          </p>
          
          <h2>Contact Us</h2>
          
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          
          <p>
            <strong>Email:</strong> terms@jackerbox.com<br />
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