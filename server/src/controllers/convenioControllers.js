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

const deleteConvenio = async (req, res) => {
    try {
        const { id } = req.params;
        await convenioService.deleteById(id);
        res.status(200).json({ message: "Convênio deletado com sucesso" });
    } catch (err) {
        if (err.message.includes('referenciado')) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Erro ao deletar convênio" });
        }
    }
};

module.exports = {
    getAllConvenios,
    createConvenio,
    deleteConvenio
};