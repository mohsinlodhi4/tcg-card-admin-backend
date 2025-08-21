const Card = require('../models/Card');
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

        const updated = await Card.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!updated) return res.status(404).json(errorResponse('Card not found'));
        res.json(updated);
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
