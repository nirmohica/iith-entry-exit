// Author: Anup
// Date: 24 March
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOTP = async(email: string, otp: string) => {
	await sgMail.send({
		from: 'Gate Access System <anup@anupchavan.com>',
		to: email,
		subject: 'Your OTP for Visitor Access',
		html: `<p>Your OTP is: <strong>${otp}</strong><p>This is a prototype</p>`
	});
};
