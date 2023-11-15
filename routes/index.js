const { Router } = require("express");
const paymentController = require("../controllers/index");
const router = Router();

router.post("/split-payments/compute", paymentController.splitPayment);

module.exports = router;
