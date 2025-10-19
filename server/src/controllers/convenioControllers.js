// Local: server/src/controllers/convenioController.js

const convenioService = require('../services/convenioService.js');

const getAllConvenios = async (req, res) => {
    try {
        const convenios = await convenioService.getAll();
        res.status(200).json(convenios);
    } catch (err) {
        res.status(500).json({ err: "Erro ao buscar convenios" });
    }
};

const createConvenio = async (req, res) => {
    try {
        const novoConvenio = await convenioService.create(req.body);
        res.status(201).json(novoConvenio);
    } catch (err) {
        res.status(500).json({ error: "erro ao criar convenio" });
    }
};

module.exports = {
    getAllConvenios,
    createConvenio
};