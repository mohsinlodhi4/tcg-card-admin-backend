const _ = require('lodash');
const {validationResult} = require('express-validator'); 

const validationResultMiddleware = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errors = result.array();
        const chain = _.chain(
            errors
        )
        .keyBy('path')
        .mapValues('msg')
        .value()

        console.log(chain)
        res.status(422).send({ message: errors[0].msg ,errors: chain,  });
        return;
    }
    next()
}

module.exports = validationResultMiddleware