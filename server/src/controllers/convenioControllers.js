// Local: server/src/controllers/convenioController.js

const convenioService = require('../services/convenioService.js');

const getAllConvenios = async (req, res, next) => {
    try {
        const convenios = await convenioService.getAll();
        res.status(200).json(convenios);
    } catch (err) {
        return next(err);
    }
};

const createConvenio = async (req, res) => {
    try {
        const novoConvenio = await convenioService.create(req.body);
        res.status(201).json(novoConvenio);
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Erro ao criar convênio." });
    }
};

const deleteConvenio = async (req, res) => {
    try {
        const { id } = req.params;
        await convenioService.deleteById(id);
        res.status(200).json({ message: "Convênio deletado com sucesso" });
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message || "Erro ao deletar convênio." });
    }
};

module.exports = {
    getAllConvenios,
    createConvenio,
    deleteConvenio
};