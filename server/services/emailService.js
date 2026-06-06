import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a password reset OTP email using Brevo REST API.
 * @param {string} toEmail - The recipient's email address
 * @param {string} otp - The 6-digit OTP code
 * @returns {Promise<boolean>} - True if sent successfully
 */
export const sendOtpEmail = async (toEmail, otp) => {
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: {
                    name: process.env.BREVO_FROM_NAME || "SportsBuzz",
                    email: process.env.BREVO_FROM_EMAIL || "noreply@sportsbuzz.com"
                },
                to: [
                    {
                        email: toEmail
                    }
                ],
                subject: 'SportsBuzz Password Reset',
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #0f172a; text-align: center;">SportsBuzz Password Reset</h2>
                        <p style="color: #334155; font-size: 16px;">Hello,</p>
                        <p style="color: #334155; font-size: 16px;">You requested to reset your password. Use the following 6-digit code to proceed:</p>
                        
                        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #dc2626;">${otp}</span>
                        </div>
                        
                        <p style="color: #334155; font-size: 16px;">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} SportsBuzz. All rights reserved.</p>
                    </div>
                `
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                }
            }
        );

        console.log(`Email sent via REST API: ${response.data.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email via Brevo REST API:');
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
        return false;
    }
};

export default {
    sendOtpEmail
};
