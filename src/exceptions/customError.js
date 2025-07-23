class CustomError extends Error {  
    constructor (message, statusCode = 400, data = null) {
        super(message)
        this.data = data;
        this.statusCode = statusCode;

        this.name = this.constructor.name
        // capturing the stack trace keeps the reference to your error class
        Error.captureStackTrace(this, this.constructor);
    }
  }

  module.exports = CustomError;