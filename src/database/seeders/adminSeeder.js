const Role = require('../../models/Role');
const User = require('../../models/User');
const bcrypt = require('bcrypt');

require('dotenv').config();
const connect = require('../connection');

connect().then( async ()=>{
    
    try {
        let role = await Role.findOne({name: 'admin'});

        let name = 'Admin';
        let email = 'admin@admin.com';
        let password = 'admin123';

        let hashPassword = await bcrypt.hash(password, 10);
        let user = await User.create({name, email, password: hashPassword, role: role._id});
        console.log('yay!!', user);
      } catch (err) {
        console.log(err);
      }
      process.exit();
});


