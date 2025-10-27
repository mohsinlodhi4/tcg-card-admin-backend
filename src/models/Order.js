const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    itemType: { 
        type: String, 
        required: true, 
        enum: ['card', 'pack', 'coins'] 
    },
    itemId: { 
        type: mongoose.Schema.Types.ObjectId
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    price: { 
        type: Number, 
        required: true 
    },
    totalPrice: { 
        type: Number, 
        required: true 
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    notes: String
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        try {
            // Use a more robust method to generate unique order numbers
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            this.orderNumber = `ORD-${timestamp}-${randomSuffix}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
