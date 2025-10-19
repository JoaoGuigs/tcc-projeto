const express = require('express')
const router = express.Router();
const convenioController = require('../controllers/convenioControllers')

router.get('/', convenioController.getAllConvenios)
router.post('/', convenioController.createConvenio)

module.exports = router;