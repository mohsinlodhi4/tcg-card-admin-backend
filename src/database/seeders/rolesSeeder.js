const Role = require('../../models/Role');
const User = require('../../models/User');
const ObjectId = require('mongoose').Types.ObjectId

require('dotenv').config();
const connect = require('../connection');

connect().then(async () => {

  const roles = [
    {
      name: "admin",
      label: "Admin",
      permissions: [
      ]
    },
    {
      name: "user",
      label: "user",
      permissions: [
      ]
    },
  ];

  try {
    await Role.deleteMany();
    const res = await Role.insertMany(roles);
    console.log('roles seeded successfully !!', res);
  } catch (err) {
    // Handle errors
    console.log(err);
  }
  process.exit();
});


