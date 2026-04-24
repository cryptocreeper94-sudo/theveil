const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const twilioConfigured = !!(accountSid && authToken && twilioPhone);

if (twilioConfigured) {
  console.log('[Twilio] Service initialized');
} else {
  console.warn('[Twilio] Missing credentials - SMS features disabled');
}

const verificationCodes = new Map<string, { code: string; expires: number; attempts: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [phone, data] of Array.from(verificationCodes.entries())) {
    if (data.expires < now) {
      verificationCodes.delete(phone);
    }
  }
}

setInterval(cleanupExpiredCodes, 60000);

async function sendTwilioSMS(to: string, body: string): Promise<boolean> {
  if (!accountSid || !authToken || !twilioPhone) {
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioPhone,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Twilio] SMS failed:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[Twilio] Request failed:', error.message);
    return false;
  }
}

export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  if (!twilioConfigured) {
    return { success: false, message: 'SMS service not configured' };
  }

  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
  
  const existing = verificationCodes.get(normalizedPhone);
  if (existing && existing.expires > Date.now() && (existing.expires - Date.now()) > 540000) {
    return { success: false, message: 'Please wait before requesting a new code' };
  }

  const code = generateCode();
  const expires = Date.now() + 600000;

  const sent = await sendTwilioSMS(
    normalizedPhone,
    `Your Trust Layer verification code is: ${code}. This code expires in 10 minutes. Never share this code with anyone.`
  );

  if (!sent) {
    return { success: false, message: 'Failed to send verification code' };
  }

  verificationCodes.set(normalizedPhone, { code, expires, attempts: 0 });
  console.log(`[Twilio] Verification code sent to ${normalizedPhone.slice(0, 4)}****`);
  
  return { success: true, message: 'Verification code sent' };
}

export async function verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
  
  const stored = verificationCodes.get(normalizedPhone);
  
  if (!stored) {
    return { success: false, message: 'No verification code found. Please request a new one.' };
  }

  if (stored.expires < Date.now()) {
    verificationCodes.delete(normalizedPhone);
    return { success: false, message: 'Verification code expired. Please request a new one.' };
  }

  if (stored.attempts >= 5) {
    verificationCodes.delete(normalizedPhone);
    return { success: false, message: 'Too many attempts. Please request a new code.' };
  }

  stored.attempts++;

  if (stored.code !== code) {
    return { success: false, message: 'Invalid verification code' };
  }

  verificationCodes.delete(normalizedPhone);
  return { success: true, message: 'Phone number verified successfully' };
}

export async function sendSecurityAlert(phoneNumber: string, message: string): Promise<boolean> {
  if (!twilioConfigured) {
    return false;
  }

  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
  return sendTwilioSMS(normalizedPhone, `Trust Layer Security: ${message}`);
}

export function isTwilioConfigured(): boolean {
  return twilioConfigured;
}
