const Role = require('../models/Role');
const User = require('../models/User');
const DataSegment = require('../models/DataSegment');
const Appointment = require('../models/appointment');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const Location = require('../models/Location');
const Service = require('../models/Service');
const bcrypt = require('bcrypt');

require('dotenv').config();
const connect = require('../database/connection');

connect().then( async ()=>{
    
    try {
        let role = await Role.findOne({name: 'provider'});
        const users = await User.find({role: role._id})
        for(let user of users) {
            let ds = user.dataSegments?.length ? {_id: user.dataSegments[0]} : null; 
            if(!ds) {
              ds = await DataSegment.create({primaryUser: user._id, planType: user.planType})
            }
            await User.updateOne({_id: user._id}, { $set: { dataSegments: [ds._id, ] } })
            await Appointment.updateMany({providerId: user._id}, {$set: {dataSegmentId: ds._id}})
            await Patient.updateMany({providerId: user._id}, {$set: {dataSegmentId: ds._id}})
            await Invoice.updateMany({provider: user._id}, {$set: {dataSegment: ds._id}})
            await Location.updateMany({user: user._id}, {$set: {dataSegment: ds._id}})
            await Service.updateMany({user: user._id}, {$set: {dataSegment: ds._id}})

            await User.updateMany({providers: user._id}, {$addToSet: { dataSegments: ds._id },})

        }

        console.log('yay!!');
      } catch (err) {
        console.log(err);
      }
      process.exit();
});


