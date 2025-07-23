const {successResponse, errorResponse} = require('../utils/functions');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const adminMiddleware = async (req, res, next)=>{
    const token = req.header('authorization')?.split(' ')?.[1];

    try{
        if(!token) throw new Error('Unauthorized');
        const {id} = jwt.verify(token, process.env.JWT_ENCRYPTION_KEY);
        req.user_id = id;
        console.log(id);
        let user = await User.findById(id).populate('role');
        if(!user) throw new Error('Unauthorized.');
        if(!user || user?.role?.name != 'admin') throw new Error('Insufficient permissions');

        if(!user || (user && user.status == 'in-active')){
            return res.status(401).json( errorResponse('Your account is locked') );
        }
        req.user = user.toObject()
        
        next(); 
    }catch(e){
        return res.status(401).json( errorResponse(e.message) );
    }
}

module.exports = adminMiddleware;