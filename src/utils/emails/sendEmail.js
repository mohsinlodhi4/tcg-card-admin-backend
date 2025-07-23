const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const sendEmail = async (email, subject, payload, template, attachments=[]) => {
  try {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 465,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const logo = "data:image/png;base64," +
      fs.readFileSync(path.join(__dirname, "../../", "logo.png")).toString("base64");
      attachments = [
        ...attachments,
        {
          filename: 'logo.png',
          path: logo,
          cid: 'logo-bluuheath'
        }
      ]

    const source = fs.readFileSync(path.join(__dirname, template), "utf8");
    handlebars.registerHelper('eq', function(arg1, arg2, options) {
        return (arg1 == arg2) ? true : false;
    });
    handlebars.registerHelper('neq', function(arg1, arg2, options) {
        return (arg1 != arg2) ? true : false;
    });
    const compiledTemplate = handlebars.compile(source);
    const options = () => {
      return {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: subject,
        html: compiledTemplate(payload),
        attachments,
      };
    };

    // Send email
    transporter.sendMail(options(), (error, info) => {
      if (error) {
        console.log("error in sending email", error)
        return error;
      }
    });
  } catch (error) {
    console.log('error: ',error);
    return error;
  }
};

module.exports = sendEmail;