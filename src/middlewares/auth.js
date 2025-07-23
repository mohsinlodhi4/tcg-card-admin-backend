const {successResponse, errorResponse} = require('../utils/functions');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next)=>{
    const token = req.header('authorization')?.split(' ')?.[1];

    if(!token) return res.status(401).json( errorResponse('Token not found') );
    try{
        const user = jwt.verify(token, process.env.JWT_ENCRYPTION_KEY);
        req.user_id = user.id
        const check = await User.findById(user.id);
        if(!check || (check && check.status == 'in-active')){
            return res.status(401).json( errorResponse('Your account is locked') );
        }
        req.user = check.toObject()
        next(); 
    }catch(e){
        console.log(e.message);
        return res.status(401).json( errorResponse('Unauthorized.') );
    }
}

module.exports = authMiddleware;