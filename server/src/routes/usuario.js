const express = require("express");
const controller = require("../controllers/usuarioController");
const validate = require("../middleware/validate");
const { requireAuth, requireAuthOrFirstUser } = require("../middleware/auth");
const schemas = require("../schemas");

const router = express.Router();
router.post("/profissionais", requireAuthOrFirstUser, validate(schemas.professional), controller.createProfissional);
router.post("/login", validate(schemas.login), controller.login);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, controller.me);

module.exports = router;
