import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Jackerbox",
  description: "Jackerbox Terms of Service and legal agreements",
};

export default function TermsOfServicePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: June 1, 2023</p>
        
        <div className="prose prose-blue max-w-none">
          <p>
            Welcome to Jackerbox. These Terms of Service ("Terms") govern your access to and use of the Jackerbox website, 
            mobile applications, and services (collectively, the "Services"). Please read these Terms carefully before using our Services.
          </p>
          
          <p>
            By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, 
            you may not access or use the Services.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Definitions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>"Jackerbox,"</strong> "we," "our," or "us" refers to Jackerbox, Inc., the company that operates the Services.
            </li>
            <li>
              <strong>"User,"</strong> "you," or "your" refers to any individual or entity that accesses or uses the Services.
            </li>
            <li>
              <strong>"Owner"</strong> refers to a User who lists equipment for rent on the Services.
            </li>
            <li>
              <strong>"Renter"</strong> refers to a User who rents equipment from an Owner through the Services.
            </li>
            <li>
              <strong>"Equipment"</strong> refers to any item listed for rent on the Services.
            </li>
            <li>
              <strong>"Rental Agreement"</strong> refers to the agreement between an Owner and a Renter regarding the rental of Equipment.
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility</h2>
          <p>
            To use the Services, you must be at least 18 years old and capable of forming a binding contract. By using the Services, 
            you represent and warrant that you meet these requirements.
          </p>
          <p>
            If you are using the Services on behalf of a company, organization, or other entity, you represent and warrant that you have 
            the authority to bind that entity to these Terms, and you agree to be bound by these Terms on behalf of that entity.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Accounts</h2>
          <p>
            To access certain features of the Services, you must create an account. When you create an account, you must provide accurate, 
            current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for 
            all activities that occur under your account.
          </p>
          <p>
            You agree to notify us immediately of any unauthorized use of your account or any other breach of security. We cannot and will not 
            be liable for any loss or damage arising from your failure to comply with these requirements.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Equipment Listings</h2>
          <p>
            Owners may list Equipment for rent on the Services. By listing Equipment, Owners represent and warrant that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>They have the legal right to rent the Equipment;</li>
            <li>The Equipment is in good working condition and safe to use;</li>
            <li>The listing information is accurate and complete;</li>
            <li>They will honor all bookings made through the Services at the listed price and terms.</li>
          </ul>
          <p>
            Jackerbox reserves the right to remove any listing at any time for any reason, without notice.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Rental Agreements</h2>
          <p>
            When a Renter books Equipment through the Services, a Rental Agreement is formed between the Owner and the Renter. 
            Jackerbox is not a party to the Rental Agreement, but provides the Services to facilitate the transaction.
          </p>
          <p>
            The Rental Agreement includes the terms specified in the listing, as well as any additional terms agreed upon by the Owner and Renter. 
            Owners and Renters are responsible for clearly communicating any specific requirements or conditions related to the rental.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Fees and Payments</h2>
          <p>
            Renters agree to pay all fees associated with their rental of Equipment, including the rental fee, security deposit (if applicable), 
            and any service fees charged by Jackerbox.
          </p>
          <p>
            Owners agree to pay any applicable service fees charged by Jackerbox for the use of the Services. Jackerbox will remit payment to 
            Owners in accordance with our payment policies, after deducting any applicable fees.
          </p>
          <p>
            All fees and payment terms are as specified on the Services at the time of booking, unless otherwise agreed in writing.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cancellations and Refunds</h2>
          <p>
            Cancellation and refund policies are as specified on the Services at the time of booking. Owners and Renters agree to comply with 
            these policies.
          </p>
          <p>
            Jackerbox reserves the right to issue refunds or credits at its sole discretion, including in cases of disputes or policy violations.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Prohibited Activities</h2>
          <p>
            You agree not to engage in any of the following prohibited activities:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violating any applicable law, regulation, or third-party rights;</li>
            <li>Using the Services for any illegal purpose;</li>
            <li>Attempting to circumvent any security measures or features of the Services;</li>
            <li>Posting false, misleading, or deceptive content;</li>
            <li>Harassing, threatening, or intimidating other Users;</li>
            <li>Using the Services to send unsolicited communications;</li>
            <li>Interfering with the proper functioning of the Services;</li>
            <li>Attempting to access data or accounts that you are not authorized to access;</li>
            <li>Using the Services in a manner that places an unreasonable load on our infrastructure;</li>
            <li>Any other activity that Jackerbox determines, in its sole discretion, to be harmful to the Services or other Users.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Intellectual Property</h2>
          <p>
            The Services and all content and materials included on the Services, including text, graphics, logos, images, and software, 
            are the property of Jackerbox or its licensors and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            Subject to your compliance with these Terms, Jackerbox grants you a limited, non-exclusive, non-transferable, revocable license 
            to access and use the Services for their intended purpose.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT 
            PERMITTED BY LAW, JACKERBOX DISCLAIMS ALL WARRANTIES, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, 
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            JACKERBOX DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, JACKERBOX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
            OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, 
            GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES;</li>
            <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES;</li>
            <li>ANY CONTENT OBTAINED FROM THE SERVICES; OR</li>
            <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</li>
          </ul>
          <p>
            IN NO EVENT SHALL JACKERBOX'S AGGREGATE LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICES EXCEED THE GREATER OF $100 OR THE 
            AMOUNT YOU PAID TO JACKERBOX IN THE PAST SIX MONTHS.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Jackerbox and its officers, directors, employees, agents, and affiliates from 
            and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) 
            arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your violation of these Terms;</li>
            <li>Your use of the Services;</li>
            <li>Your violation of any rights of another person or entity; or</li>
            <li>Your breach of any Rental Agreement.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Modifications to Terms</h2>
          <p>
            Jackerbox reserves the right to modify these Terms at any time. We will provide notice of material changes by posting the updated 
            Terms on the Services and updating the "Last updated" date at the top of these Terms.
          </p>
          <p>
            Your continued use of the Services after the effective date of the revised Terms constitutes your acceptance of the changes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Termination</h2>
          <p>
            Jackerbox may terminate or suspend your access to the Services at any time, for any reason, without notice. Upon termination, 
            your right to use the Services will immediately cease.
          </p>
          <p>
            All provisions of these Terms that by their nature should survive termination shall survive, including, without limitation, 
            ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its 
            conflict of law provisions.
          </p>
          <p>
            Any dispute arising from or relating to these Terms or the Services shall be resolved exclusively in the state or federal courts 
            located in San Francisco County, California, and you consent to the personal jurisdiction of such courts.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">16. Miscellaneous</h2>
          <p>
            These Terms constitute the entire agreement between you and Jackerbox regarding the Services and supersede all prior agreements 
            and understandings.
          </p>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
          </p>
          <p>
            Jackerbox's failure to enforce any right or provision of these Terms will not be considered a waiver of such right or provision.
          </p>
          <p>
            You may not assign or transfer these Terms or your rights under these Terms without Jackerbox's prior written consent. 
            Jackerbox may assign or transfer these Terms without your consent.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">17. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            Jackerbox, Inc.<br />
            123 Equipment Lane<br />
            San Francisco, CA 94107<br />
            Email: legal@jackerbox.com
          </p>
        </div>
        
        <div className="mt-12 border-t pt-8">
          <p className="text-gray-600 mb-4">
            By using Jackerbox, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <div className="flex space-x-4">
            <Link href="/routes/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/routes/cookies" className="text-blue-600 hover:underline">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 