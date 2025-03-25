import { sendOTP } from './server/utils/email';

// Test email sending
async function testEmail() {
  try {
    await sendOTP('recipient@example.com', '123456');
    console.log('✅ OTP email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send OTP:', error);
  }
}

testEmail();
