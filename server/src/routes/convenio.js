const express = require('express')
const router = express.Router();
const convenioController = require('../controllers/convenioControllers')

router.get('/', convenioController.getAllConvenios)
router.post('/', convenioController.createConvenio)
router.delete('/:id', convenioController.deleteConvenio)

module.exports = router;