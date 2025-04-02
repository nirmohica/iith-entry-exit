import sgMail from "@sendgrid/mail";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  throw new Error(
    "SENDGRID_API_KEY is not defined in the environment variables",
  );
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an OTP to a resident's email address using SendGrid
 * @param email - Recipient's email address
 * @param otp - One-time password to be sent
 */
export const sendOTP = async (email: string, otp: string) => {
  try {
    await sgMail.send({
      from: "Gate Access System <noreply@anupchavan.com>",
      to: email,
      subject: "Your OTP for Visitor Access",
      html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This is a prototype</p>`,
    });
    console.log("OTP email sent successfully, otp:", otp);
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body);
    throw new Error("Failed to send OTP email");
  }
};
