const Role = require('../../models/Role');
const User = require('../../models/User');
const ObjectId = require('mongoose').Types.ObjectId

require('dotenv').config();
const connect = require('../connection');

connect().then(async () => {

  const roles = [
    {
      name: "admin",
      permissions: [
        'manage-reminders',
        'manage-patients', 'manage-claims',
        'manage-appointments', 'manage-services',
        'manage-availability', 'manage-insurance-claims',
        'manage-invoices', 'view-sessions',
        'view-appointments', 'view-analytics', 'manage-activities',
        'admin-settings'
      ]
    },
    {
      name: "provider",
      permissions: [
        'manage-team', 'manage-reminders', 'manage-documents',
        'manage-locations',
        'manage-patients', 'manage-claims',
        'manage-appointments', 'manage-services',
        'manage-availability', 'manage-insurance-claims',
        'manage-invoices', 'view-sessions',
        'view-appointments', 'view-analytics', 'manage-activities',
        'admin-settings'
      ]
    },
    {
      name: "patient",
      permissions: [
        'user-appointments',
        'user-invoices',
        'user-settings'
        ,
      ]
    },
    {
      name: "provider-team-member", // provider's team member
      permissions: [
        'admin-settings',
        'manage-locations',
        'manage-activities',
      ]
    },
  ];

  try {
    await Role.deleteMany();
    const res = await Role.insertMany(roles);
    console.log('yay!!', res);
    // for(let role of res ) {
    //   if(role.name == 'provider') {
    //     await User.updateMany({role: ObjectId("66a61fd6d1b59fd4636eef2a")}, {role: role._id })
    //   } else if (role.name == 'patient') {
    //     await User.updateMany({role: ObjectId("66a61fd6d1b59fd4636eef2b")}, {role: role._id })
    //   }
    // }
  } catch (err) {
    // Handle errors
    console.log(err);
  }
  process.exit();
});


