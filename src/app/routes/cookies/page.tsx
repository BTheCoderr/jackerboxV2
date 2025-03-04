import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Jackerbox",
  description: "Learn about how Jackerbox uses cookies and similar technologies",
};

export default function CookiePolicyPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: June 1, 2023</p>
        
        <div className="prose prose-blue max-w-none">
          <p>
            This Cookie Policy explains how Jackerbox ("we", "us", or "our") uses cookies and similar technologies 
            to recognize you when you visit our website and use our services (collectively, the "Services"). 
            It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">What Are Cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. 
            Cookies are widely used by website owners to make their websites work, or to work more efficiently, 
            as well as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, Jackerbox) are called "first-party cookies". 
            Cookies set by parties other than the website owner are called "third-party cookies". 
            Third-party cookies enable third-party features or functionality to be provided on or through the website 
            (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies 
            can recognize your computer both when it visits the website in question and also when it visits certain other websites.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Why Do We Use Cookies?</h2>
          <p>
            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons 
            in order for our Services to operate, and we refer to these as "essential" or "strictly necessary" cookies. 
            Other cookies also enable us to track and target the interests of our users to enhance the experience on our Services. 
            Third parties serve cookies through our Services for advertising, analytics, and other purposes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Essential Cookies</h3>
          <p>
            These cookies are strictly necessary to provide you with services available through our Services and to use some of its features, 
            such as access to secure areas. Because these cookies are strictly necessary to deliver the Services, you cannot refuse them 
            without impacting how our Services function.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Performance and Functionality Cookies</h3>
          <p>
            These cookies are used to enhance the performance and functionality of our Services but are non-essential to their use. 
            However, without these cookies, certain functionality may become unavailable.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Analytics and Customization Cookies</h3>
          <p>
            These cookies collect information that is used either in aggregate form to help us understand how our Services are being used 
            or how effective our marketing campaigns are, or to help us customize our Services for you.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Advertising Cookies</h3>
          <p>
            These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad 
            from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting advertisements that are 
            based on your interests.
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Social Media Cookies</h3>
          <p>
            These cookies are used to enable you to share pages and content that you find interesting on our Services through third-party 
            social networking and other websites. These cookies may also be used for advertising purposes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Specific Cookies We Use</h2>
          <p>
            Below is a detailed list of the cookies we use on our Services:
          </p>
          
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Cookie Name</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Purpose</th>
                  <th className="px-4 py-2 border">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border">_jb_session</td>
                  <td className="px-4 py-2 border">Essential</td>
                  <td className="px-4 py-2 border">Used to maintain your session and authentication status</td>
                  <td className="px-4 py-2 border">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">_jb_csrf_token</td>
                  <td className="px-4 py-2 border">Essential</td>
                  <td className="px-4 py-2 border">Used to prevent cross-site request forgery attacks</td>
                  <td className="px-4 py-2 border">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">_jb_preferences</td>
                  <td className="px-4 py-2 border">Functionality</td>
                  <td className="px-4 py-2 border">Stores your preferences and settings</td>
                  <td className="px-4 py-2 border">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">_ga</td>
                  <td className="px-4 py-2 border">Analytics</td>
                  <td className="px-4 py-2 border">Used by Google Analytics to distinguish users</td>
                  <td className="px-4 py-2 border">2 years</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">_gid</td>
                  <td className="px-4 py-2 border">Analytics</td>
                  <td className="px-4 py-2 border">Used by Google Analytics to distinguish users</td>
                  <td className="px-4 py-2 border">24 hours</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border">_fbp</td>
                  <td className="px-4 py-2 border">Advertising</td>
                  <td className="px-4 py-2 border">Used by Facebook to deliver advertisements</td>
                  <td className="px-4 py-2 border">3 months</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How Can You Control Cookies?</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the 
            appropriate opt-out links provided in the cookie table above.
          </p>
          <p>
            You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still 
            use our Services though your access to some functionality and areas may be restricted. As the means by which you can refuse cookies 
            through your web browser controls vary from browser to browser, you should visit your browser's help menu for more information.
          </p>
          <p>
            In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more 
            information, please visit <a href="http://www.aboutads.info/choices/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">http://www.aboutads.info/choices/</a> or 
            <a href="http://www.youronlinechoices.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer"> http://www.youronlinechoices.com</a>.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Do Not Track</h2>
          <p>
            Some browsers have a "Do Not Track" feature that lets you tell websites that you do not want to have your online activities tracked. 
            These features are not yet uniform, so we are currently not set up to respond to such signals.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other 
            operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies 
            and related technologies.
          </p>
          <p>
            The date at the top of this Cookie Policy indicates when it was last updated.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about our use of cookies or other technologies, please contact us at:
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
            By using Jackerbox, you acknowledge that you have read and understood this Cookie Policy.
          </p>
          <div className="flex space-x-4">
            <Link href="/routes/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>
            <Link href="/routes/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 