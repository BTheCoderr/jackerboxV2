import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send email to your support inbox
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@jackerbox.app';
    
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@jackerbox.app',
      to: supportEmail,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; color: #6c757d;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 8px; font-size: 12px; color: #6c757d;">
            <p><strong>Reply Instructions:</strong> Reply directly to this email to respond to ${name} at ${email}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      replyTo: email, // This allows you to reply directly to the customer
    });

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Send confirmation email to the customer
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@jackerbox.app',
      to: email,
      subject: 'Thank you for contacting Jackerbox',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Thank you for reaching out!</h2>
          
          <p>Hi ${name},</p>
          
          <p>We've received your message and will get back to you within 24 hours.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Your Message:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p>Best regards,<br>The Jackerbox Team</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d;">
            If you need immediate assistance, you can also reach us at ${supportEmail}
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message sent successfully! We\'ll get back to you soon.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 