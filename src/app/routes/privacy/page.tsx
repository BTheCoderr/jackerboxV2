import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Jackerbox",
  description: "Jackerbox Privacy Policy - Learn how we collect, use, and protect your personal information",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: June 1, 2023</p>
        
        <div className="prose prose-blue max-w-none">
          <p>
            At Jackerbox, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you use our website, mobile application, and services (collectively, the "Service").
          </p>
          
          <p>
            Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, 
            understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, 
            please do not use our Service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">1.1 Personal Information</h3>
          <p>
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Register for an account</li>
            <li>List equipment for rent</li>
            <li>Rent equipment from others</li>
            <li>Complete forms or surveys</li>
            <li>Contact our customer support</li>
            <li>Participate in promotions or contests</li>
          </ul>
          <p>
            This information may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name, email address, phone number, and mailing address</li>
            <li>Payment information (processed securely through our payment processors)</li>
            <li>Government-issued identification (for identity verification purposes)</li>
            <li>Profile photos and other content you choose to upload</li>
            <li>Communications with other users through our platform</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">1.2 Automatically Collected Information</h3>
          <p>
            When you access or use our Service, we may automatically collect certain information, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device information (such as your IP address, browser type, operating system)</li>
            <li>Usage data (such as pages visited, time spent on pages, links clicked)</li>
            <li>Location information (with your consent)</li>
            <li>Cookies and similar tracking technologies (as described in our Cookie Policy)</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We may use the information we collect for various purposes, including to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process transactions and send related information</li>
            <li>Verify your identity and prevent fraud</li>
            <li>Facilitate communication between equipment owners and renters</li>
            <li>Send administrative information, such as updates to our policies</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Protect the security and integrity of our Service</li>
            <li>Comply with legal obligations</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Share Your Information</h2>
          <p>
            We may share your information in the following circumstances:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">3.1 With Other Users</h3>
          <p>
            When you list equipment or rent from others, we share information necessary to facilitate the transaction, 
            such as your name, profile photo, and contact information.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">3.2 With Service Providers</h3>
          <p>
            We may share your information with third-party service providers who perform services on our behalf, 
            such as payment processing, data analysis, email delivery, hosting, customer service, and marketing assistance.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">3.3 For Legal Purposes</h3>
          <p>
            We may disclose your information if required to do so by law or in response to valid requests by public authorities. 
            We may also disclose your information to protect our rights, privacy, safety, or property, or that of our users or others.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">3.4 Business Transfers</h3>
          <p>
            If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be 
            transferred as part of that transaction. We will notify you of any change in ownership or uses of your information.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">3.5 With Your Consent</h3>
          <p>
            We may share your information for any other purpose with your consent.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect the security of your personal information. 
            However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure, 
            and we cannot guarantee absolute security.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The right to access and receive a copy of your personal information</li>
            <li>The right to correct inaccurate or incomplete information</li>
            <li>The right to delete your personal information</li>
            <li>The right to restrict or object to processing of your personal information</li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Children's Privacy</h2>
          <p>
            Our Service is not directed to children under the age of 18. We do not knowingly collect personal information from 
            children under 18. If you are a parent or guardian and believe that your child has provided us with personal information, 
            please contact us, and we will take steps to delete such information.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. International Data Transfers</h2>
          <p>
            Your information may be transferred to, and maintained on, computers located outside of your state, province, country, 
            or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. 
            If you are located outside the United States and choose to provide information to us, please note that we transfer 
            the information to the United States and process it there.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Third-Party Links and Services</h2>
          <p>
            Our Service may contain links to third-party websites, services, or applications that are not operated by us. 
            We have no control over and assume no responsibility for the content, privacy policies, or practices of any 
            third-party sites or services. We encourage you to review the privacy policies of these third parties.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
            on this page and updating the "Last updated" date at the top of this Privacy Policy. You are advised to review this 
            Privacy Policy periodically for any changes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            Jackerbox, Inc.<br />
            123 Equipment Lane<br />
            San Francisco, CA 94107<br />
            Email: privacy@jackerbox.com
          </p>
        </div>
        
        <div className="mt-12 border-t pt-8">
          <p className="text-gray-600 mb-4">
            By using Jackerbox, you acknowledge that you have read, understood, and agree to this Privacy Policy.
          </p>
          <div className="flex space-x-4">
            <Link href="/routes/terms" className="text-blue-600 hover:underline">
              Terms of Service
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