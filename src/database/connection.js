const mongoose = require('mongoose');

const connectDB = async ( cb=()=>{} ) => {
  try {
    await mongoose.connect(
      process.env.DB_URI,
      {
        useNewUrlParser: true
      }
    );

    console.log('Database connected');
    cb();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;