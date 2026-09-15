const express = require('express')
const router = express.Router();
const validate = require('../middleware/validate')
const schemas = require('../schemas')
const convenioController = require('../controllers/convenioControllers')

router.get('/', convenioController.getAllConvenios)
router.post('/', validate(schemas.convenio), convenioController.createConvenio)
router.delete('/:id', validate(schemas.idParams, 'params'), convenioController.deleteConvenio)

module.exports = router;
