const mongoose = require('mongoose');

const userItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemType: {
        type: String,
        required: true,
        enum: ['card', 'pack']
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },
    acquiredAt: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['purchase', 'pack_opening', 'trade', 'gift'],
        default: 'purchase'
    }
}, {
    timestamps: true
});

// Compound index to ensure unique user-item combinations
userItemSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('UserItem', userItemSchema);
