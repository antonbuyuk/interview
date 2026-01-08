const express = require('express');
const router = express.Router();
const termsController = require('../controllers/termsController');
const errorHandler = require('../middleware/errorHandler');
const authAdmin = require('../middleware/authAdmin');

router.get('/', termsController.getTerms);
router.get('/:id', termsController.getTermById);
router.post('/suggestions', termsController.getTermSuggestions);
router.post('/', authAdmin, termsController.createTerm);
router.put('/:id', authAdmin, termsController.updateTerm);
router.delete('/:id', authAdmin, termsController.deleteTerm);

router.use(errorHandler);

module.exports = router;
