const Role = require('../models/Role');
const User = require('../models/User');
const DataSegment = require('../models/DataSegment');
const Appointment = require('../models/appointment');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const bcrypt = require('bcrypt');

require('dotenv').config();
const connect = require('../database/connection');

connect().then( async ()=>{
    
    try {
        await Role.updateOne({name: 'provider'}, {
            $addToSet: {
                permissions: {$each: [
                    "manage-team", "manage-reminders", "manage-documents",
                    'manage-locations'
                ] },
            }
        });
        await Role.updateOne({
            name: "provider-team-member", // provider's team member
        },{
            $set: {
                permissions: [
                    "manage-locations",
                    "manage-activities",
                    "admin-settings",
                ]
            }
        }, {
            upsert: true,
        })

        console.log('role and permissions modofied !!');
      } catch (err) {
        console.log(err);
      }
      process.exit();
});


