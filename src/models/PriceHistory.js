const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
    card: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
        required: true,
        index: true
    },
    price: {
        type: Number,
        required: true
    },
    previousPrice: {
        type: Number,
        default: 0
    },
    change: {
        type: Number, // Percentage change from previous price
        default: 0
    },
    volume: {
        type: Number, // Trading volume for this period
        default: 0
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient querying by card and date
priceHistorySchema.index({ card: 1, date: -1 });

// Method to calculate change percentage
priceHistorySchema.methods.calculateChange = function() {
    if (this.previousPrice > 0) {
        this.change = ((this.price - this.previousPrice) / this.previousPrice) * 100;
    } else {
        this.change = 0;
    }
    return this.change;
};

// Static method to get latest price history for a card
priceHistorySchema.statics.getLatestByCard = function(cardId) {
    return this.findOne({ card: cardId }).sort({ date: -1 });
};

module.exports = mongoose.model('PriceHistory', priceHistorySchema);