const Role = require('../../models/Role');
const User = require('../../models/User');
const DataSegment = require('../../models/DataSegment');
const bcrypt = require('bcrypt');

require('dotenv').config();
const connect = require('../connection');

connect().then( async ()=>{
    
    try {
        let role = await Role.findOne({name: 'provider'});

        let name = 'Johnny English';
        let email = 'test-provider2@yopmail.com';
        let password = '123123123';

        let hashPassword = await bcrypt.hash(password, 10);
        let user = await User.create({name, email, password: hashPassword, role: role._id});
        let ds = await DataSegment.create({primaryUser: user._id, planType: "test"})
        user.dataSegments = [ds._id, ]
        await user.save()
        console.log('yay!!', user);
      } catch (err) {
        console.log(err);
      }
      process.exit();
});


