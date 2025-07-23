const twilio = require('twilio');
let instance = null;

const getInstance = ()=>{
  try {
    if(!instance) {
      instance = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    }
    return instance
  } catch(e) {
    console.log("error init twilio", e)
    return null
  }
}

const sendSMS = async (to, body) => {
  try{
    let client = getInstance()

    const response = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log("sms sent", response)
    return response
  } catch(e) {
    console.log("error in sms api", e)
  }
};

module.exports = sendSMS;
