const express = require('express');
const router = express.Router();
const answersController = require('../controllers/answersController');
const errorHandler = require('../middleware/errorHandler');
const authAdmin = require('../middleware/authAdmin');

router.put('/:id', authAdmin, answersController.updateAnswer);
router.delete('/:id', authAdmin, answersController.deleteAnswer);

router.use(errorHandler);

module.exports = router;
