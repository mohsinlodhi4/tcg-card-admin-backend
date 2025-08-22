const Pack = require('../models/Pack');
const { successResponse, errorResponse } = require('../utils/functions');

// Helpers
const toNumber = val => typeof val === 'string' ? parseInt(val, 10) : val;

const normalizeRarityRatios = (data) => {
    if (data.rarityRatios) {
        data.rarityRatios = {
            common: toNumber(data.rarityRatios.common) || 0,
            rare: toNumber(data.rarityRatios.rare) || 0,
            epic: toNumber(data.rarityRatios.epic) || 0,
            legendary: toNumber(data.rarityRatios.legendary) || 0
        };
    }
    return data;
};

exports.create = async (req, res) => {
    try {
        let data = req.body;
        data.price = toNumber(data.price);
        data.cardsPerPack = toNumber(data.cardsPerPack);
        normalizeRarityRatios(data);
        data.updatedBy = req.user_id;
        
        const pack = new Pack(data);
        await pack.save();
        res.status(201).json(successResponse("Pack created successfully.", pack));
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

        const [packs, total] = await Promise.all([
            Pack.find(filter).populate('cards').sort({ createdAt: -1 }).skip(skip).limit(limit),
            Pack.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            total,
            page,
            totalPages,
            limit,
            data: packs
        });
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// GET ONE
exports.getById = async (req, res) => {
    try {
        const pack = await Pack.findById(req.params.id).populate('cards');
        if (!pack) return res.status(404).json(errorResponse('Pack not found'));
        res.json(successResponse("Pack details fetched", pack));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        let data = req.body;
        data.price = toNumber(data.price);
        data.cardsPerPack = toNumber(data.cardsPerPack);
        normalizeRarityRatios(data);
        data.updatedBy = req.user_id;

        const updated = await Pack.findByIdAndUpdate(req.params.id, data, { new: true }).populate('cards');
        if (!updated) return res.status(404).json(errorResponse('Pack not found'));
        res.json(updated);
    } catch (err) {
        res.status(400).json(errorResponse(err.message));
    }
};

exports.delete = async (req, res) => {
    try {
        const deleted = await Pack.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json(errorResponse('Pack not found'));
        res.json({ message: 'Pack deleted successfully' });
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    }
};
