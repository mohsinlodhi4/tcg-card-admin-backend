const Card = require('../models/Card');
const PriceHistory = require('../models/PriceHistory');
const { successResponse, errorResponse } = require('../utils/functions');

// Helpers
const toNumber = val => typeof val === 'string' ? parseInt(val, 10) : val;

const normalizeStats = (data) => {
    if (data.stats) {
        data.stats = {
            attack: toNumber(data.stats.attack) || 0,
            defense: toNumber(data.stats.defense) || 0,
            hp: toNumber(data.stats.hp) || 0,
            speed: toNumber(data.stats.speed) || 0,
            manaCost: toNumber(data.stats.manaCost) || 0,
            level: toNumber(data.stats.level) || 0
        };
    }
    return data;
};

exports.create = async (req, res) => {
    try {
        let data = req.body;
        data.price = toNumber(data.price);
        data.quantity = toNumber(data.quantity);
        data.minPriceAlert = toNumber(data.minPriceAlert);
        data.maxPriceAlert = toNumber(data.maxPriceAlert);
        normalizeStats(data);
        data.updatedBy = req.user_id;
        
        const card = new Card(data);
        await card.save();
        res.status(201).json(successResponse("Card created successfully.", card));
    } catch (err) {
        res.status(400).json(errorResponse(err.message));
    }
};

// GET ALL
exports.getAll = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        let search = req.query.search || '';
        let filter = {};
        
        if (search && !!search.trim()) {
            filter.name = new RegExp(search.trim(), 'i');
        }

        const skip = (page - 1) * limit;

        const [cards, total] = await Promise.all([
            Card.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Card.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            total,
            page,
            totalPages,
            limit,
            data: cards
        });
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// GET ONE
exports.getById = async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json(errorResponse('Card not found'));
        res.json(successResponse("Card details fetched", card));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        let data = req.body;
        data.price = toNumber(data.price);
        data.quantity = toNumber(data.quantity);
        data.minPriceAlert = toNumber(data.minPriceAlert);
        data.maxPriceAlert = toNumber(data.maxPriceAlert);
        normalizeStats(data);
        data.updatedBy = req.user_id;

        // Get the current card to compare prices
        const currentCard = await Card.findById(req.params.id);
        if (!currentCard) return res.status(404).json(errorResponse('Card not found'));

        const updated = await Card.findByIdAndUpdate(req.params.id, data, { new: true });
        
        // If price changed, create a price history entry
        if (data.price && data.price !== currentCard.price) {
            const priceHistory = new PriceHistory({
                card: req.params.id,
                price: data.price,
                previousPrice: currentCard.price,
                volume: data.volume || 0 // You can get this from request or set default
            });
            
            // Calculate the change percentage
            priceHistory.calculateChange();
            await priceHistory.save();
        }

        res.json(successResponse("Card updated successfully", updated));
    } catch (err) {
        res.status(400).json(errorResponse(err.message));
    }
};

exports.delete = async (req, res) => {
    try {
        const deleted = await Card.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json(errorResponse('Card not found'));
        res.json({ message: 'Card deleted successfully' });
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// GET PRICE HISTORY
exports.getPriceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        let { page = 1, limit = 10, period = 'all' } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        
        // Verify card exists
        const card = await Card.findById(id);
        if (!card) return res.status(404).json(errorResponse('Card not found'));

        // Build date filter based on period
        let dateFilter = {};
        const now = new Date();
        
        switch (period) {
            case '1d':
                dateFilter = { date: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
                break;
            case '7d':
                dateFilter = { date: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case '30d':
                dateFilter = { date: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
                break;
            case '90d':
                dateFilter = { date: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
                break;
            default:
                // 'all' - no date filter
                break;
        }

        const filter = { card: id, ...dateFilter };
        const skip = (page - 1) * limit;

        const [priceHistory, total] = await Promise.all([
            PriceHistory.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PriceHistory.countDocuments(filter)
        ]);

        // Format the data for the frontend table
        const formattedHistory = priceHistory.map(entry => ({
            id: entry._id,
            date: entry.date,
            price: entry.price,
            change: entry.change,
            volume: entry.volume,
            previousPrice: entry.previousPrice
        }));

        const totalPages = Math.ceil(total / limit);

        res.json(successResponse("Price history fetched successfully", {
            total,
            page,
            totalPages,
            limit,
            period,
            data: formattedHistory
        }));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// ADD PRICE HISTORY ENTRY (Manual entry - optional)
exports.addPriceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, volume = 0, date } = req.body;

        if (!price) {
            return res.status(400).json(errorResponse('Price is required'));
        }

        // Verify card exists
        const card = await Card.findById(id);
        if (!card) return res.status(404).json(errorResponse('Card not found'));

        // Get the latest price history for comparison
        const latestHistory = await PriceHistory.getLatestByCard(id);
        
        const priceHistory = new PriceHistory({
            card: id,
            price: toNumber(price),
            previousPrice: latestHistory ? latestHistory.price : card.price,
            volume: toNumber(volume),
            date: date ? new Date(date) : new Date()
        });

        // Calculate the change percentage
        priceHistory.calculateChange();
        await priceHistory.save();

        res.status(201).json(successResponse("Price history entry added successfully", priceHistory));
    } catch (err) {
        res.status(400).json(errorResponse(err.message));
    }
};
