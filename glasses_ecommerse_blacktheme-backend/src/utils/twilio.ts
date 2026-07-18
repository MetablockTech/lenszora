import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
const from = process.env.TWILIO_FROM
const template = process.env.TWILIO_OTP_TEMPLATE || 'Dear Customer, your OTP for verification is {#OTP#}'

const client = twilio(accountSid, authToken)

export async function sendOTP(phone: string, otp: string) {
  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not set. OTP:', otp)
    return
  }

  // Support both common placeholder formats
  const messageBody = template
    .replace('{#OTP#}', otp)
    .replace('(#OTP#', otp)

  await client.messages.create({
    body: messageBody,
    messagingServiceSid: messagingServiceSid,
    from: !messagingServiceSid ? from : undefined,
    to: phone
  })
}
