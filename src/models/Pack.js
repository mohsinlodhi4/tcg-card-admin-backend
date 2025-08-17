const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    coins: { type: Number, required: true },
    image: { type: String, required: true },
    stock: { type: Number, required: true },
    winningChance: { type: Number, required: true }
}, { _id: false });

const packSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    coinsPerPack: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    image: { type: String },

    firstPrize: [prizeSchema],
    secondPrize: [prizeSchema],
    thirdPrize: [prizeSchema],
    grandPrize: [prizeSchema],

    tags: [String],
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    } 
}, {
    timestamps: true
});

module.exports = mongoose.model('Pack', packSchema);
