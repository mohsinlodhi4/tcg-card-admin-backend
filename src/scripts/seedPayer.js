require('dotenv').config()
const Payer = require('../models/Payer');
const claimHelper = require('../utils/claimApiHelper')
const connect = require('../database/connection');

async function seedPayers() {
  try {
    await connect()
    console.log('✅ Connected to MongoDB');

    const timeStart = new Date()
    console.log("Starting fetch payers")
    const payerList = await claimHelper.getPayerList();
    const timeEnd = new Date() - timeStart
    console.log("Payers fetched in ", timeEnd/1000, "seconds") 
    console.log(`✅ Fetched ${payerList.length} payers.`);

    console.log("Starting seeding")
    const timeStart2 = new Date()
    for (const payer of payerList) {
      await Payer.updateOne(
        { payerId: payer.payerid },
        {
          payerId: payer.payerid,
          name: payer.payer_name,
          state: payer.payer_state,
          type: payer.payer_type,
          eligibility: payer.eligibility,
          auto: payer.auto,
          attachment: payer.attachment,
          claims1500: payer['1500_claims'],
          era: payer.era,
          workersComp: payer.workers_comp,
          dentClaims: payer.dent_claims,
          ubClaims: payer.ub_claims,
          secondarySupport: payer.secondary_support,
          avgEraEnrollDays: payer.avg_era_enroll_days,
          altNames: Array.isArray(payer.payer_alt_names)
                      ? payer.payer_alt_names.map(a => ({ altPayerName: a.alt_payer_name }))
                      : []
        },
        { upsert: true }
      );
    }
    const timeEnd2 = new Date() - timeStart2
    console.log(`✅ Seeded ${payerList.length} payers to the database in ${timeEnd2/1000} seconds.`);
  } catch (err) {
    console.error('❌ Seeding error:', err.response?.data || err.message || err);
  } finally {
    process.exit()
  }
}

seedPayers();
