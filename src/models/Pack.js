const mongoose = require('mongoose');

const rarityRatiosSchema = new mongoose.Schema({
    common: { type: Number, default: 0 },
    rare: { type: Number, default: 0 },
    epic: { type: Number, default: 0 },
    legendary: { type: Number, default: 0 }
}, { _id: false });

const packSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    cardsPerPack: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    image: { type: String },
    cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
    rarityRatios: { type: rarityRatiosSchema, default: () => ({}) },
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pack', packSchema);
