const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const errorHandler = require('../middleware/errorHandler');

router.post('/login', adminController.login);

router.use(errorHandler);

module.exports = router;