const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
var fs = require('fs');

require('dotenv').config()
async function main(){
    await require('./database/connection')();
    require('./jobs/index')

    const app = express();
    app.use(express.json({limit: '50mb'}));
    app.use(express.urlencoded({extended: false}));
    // app.use(helmet({
    //     crossOriginResourcePolicy: false,
    // }));
    app.use(cors({origin: '*'}));
    app.use(express.static('public'));
    
    const dir = 'public/uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Routes
    const routes = require('./routes/index');
    app.use('/api',routes);
    
    app.get('/', (req, res)=> res.send('Working'))
    
    const PORT  = process.env.PORT || 3000;
    app.listen(PORT,()=> console.log(`Node App Running at http://localhost:${PORT}`));

}

main();