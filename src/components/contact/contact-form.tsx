"use client";

import { useState } from "react";
import { toast } from "sonner";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real application, you would send this data to your API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      
      toast.success("Message sent successfully! We'll get back to you soon.");
    } catch (error) {
      toast.error("Failed to send message. Please try again later.");
      console.error("Contact form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-jacker-blue focus:border-jacker-blue"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-jacker-blue focus:border-jacker-blue"
        />
      </div>
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject *
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-jacker-blue focus:border-jacker-blue"
        >
          <option value="">Select a subject</option>
          <option value="General Inquiry">General Inquiry</option>
          <option value="Support Request">Support Request</option>
          <option value="Billing Question">Billing Question</option>
          <option value="Feature Request">Feature Request</option>
          <option value="Report an Issue">Report an Issue</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-jacker-blue focus:border-jacker-blue"
        ></textarea>
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-jacker-blue hover:bg-opacity-90"
          }`}
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        * Required fields. We'll never share your information with third parties.
      </p>
    </form>
  );
} 