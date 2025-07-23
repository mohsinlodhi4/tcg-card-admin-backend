require('dotenv').config();
const connect = require('../database/connection');
// const availity = require('../utils/availityHelper')
const claimHelper = require('../utils/claimApiHelper')

main()

async function main(){
    
    const payerList = await claimHelper.getPayerList()
    console.log("payerList", payerList)
    process.exit()
}