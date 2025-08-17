const Pack = require('../models/Pack');
const { successResponse, errorResponse } = require('../utils/functions');

// Helpers
const toNumber = val => typeof val === 'string' ? parseInt(val, 10) : val;

const normalizePrizes = (data) => {
    ['firstPrize', 'secondPrize', 'thirdPrize', 'grandPrize'].forEach(prizeType => {
        data[prizeType] = (data[prizeType] || []).map(p => ({
            ...p,
            id: toNumber(p.id),
            coins: toNumber(p.coins),
            stock: toNumber(p.stock),
            winningChance: toNumber(p.winningChance)
        }));
    });
    return data;
};

exports.create = async (req, res) => {
    try {
        let data = req.body;
        data.coinsPerPack = toNumber(data.coinsPerPack);
        data.totalQuantity = toNumber(data.totalQuantity);
        normalizePrizes(data);
        data.updatedBy = req.user_id
        const product = new Pack(data);
        await product.save();
        res.status(201).json(successResponse("Pack created successfully.", product));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET ALL
exports.getAll = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        let search = req.query.search || ''
        let filter = {}
        if(search && !!search.trim()) {
            filter.title = new RegExp(search.trim(), 'i') 
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Pack.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Pack.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            total,
            page,
            totalPages,
            limit,
            data: products
        });
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// GET ONE
exports.getById = async (req, res) => {
    try {
        const product = await Pack.findById(req.params.id);
        if (!product) return res.status(404).json(errorResponse('Pack not found'));
        res.json(successResponse("Pack details fetched", product));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        let data = req.body;
        data.coinsPerPack = toNumber(data.coinsPerPack);
        data.totalQuantity = toNumber(data.totalQuantity);
        normalizePrizes(data);
        data.updatedBy = req.user_id

        const updated = await Pack.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!updated) return res.status(404).json({ error: 'Pack not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const deleted = await Pack.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Pack not found' });
        res.json({ message: 'Pack deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
