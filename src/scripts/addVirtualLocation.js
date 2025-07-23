const Role = require('../models/Role');
const User = require('../models/User');
const DataSegment = require('../models/DataSegment');
const Appointment = require('../models/appointment');
const Patient = require('../models/Patient');
const Location = require('../models/Location');
const bcrypt = require('bcrypt');

require('dotenv').config();
const connect = require('../database/connection');

connect().then( async ()=>{
    
    try {
        const providerRole = await Role.findOne({name: 'provider'})
        const providers = await User.find({role: providerRole._id}, {_id: 1, dataSegments: 1}).lean()
        let locations = providers.map(provider => ({
                name: 'Virtual',
                color: '#1677ff',
                public: true,
                isVirtual: true,
                insurancePlace: 'Virtual',
                dataSegment: provider.dataSegments[0],
                user: provider._id,
        }))
        await Location.insertMany(locations)
        
        console.log('location modofied !!');
      } catch (err) {
        console.log(err);
      }
      process.exit();
});


