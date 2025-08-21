const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    hp: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    manaCost: { type: Number, default: 0 },
    level: { type: Number, default: 0 }
}, { _id: false });

const cardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    tags: [{ type: String }],
    series: { type: String },
    rarity: { type: String },
    edition: { type: String },
    price: { type: Number, default: 0 },
    condition: { type: String },
    description: { type: String },
    quantity: { type: Number },
    minPriceAlert: { type: Number },
    maxPriceAlert: { type: Number },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    stats: { type: statsSchema, default: () => ({}) },
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Card', cardSchema);
