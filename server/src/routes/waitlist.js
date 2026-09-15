const express = require("express");
const validate = require("../middleware/validate");
const schemas = require("../schemas");
const controller = require("../controllers/waitlistController");

const router = express.Router();
router.get("/", controller.list);
router.post("/", validate(schemas.waitlist), controller.create);
router.patch("/:id", validate(schemas.idParams, "params"), validate(schemas.waitlistUpdate), controller.update);

module.exports = router;
