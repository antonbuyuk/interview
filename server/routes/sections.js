const express = require('express');
const router = express.Router();
const sectionsController = require('../controllers/sectionsController');
const errorHandler = require('../middleware/errorHandler');
const authAdmin = require('../middleware/authAdmin');

router.get('/', sectionsController.getSections);
router.get('/:id', sectionsController.getSectionById);
router.post('/', authAdmin, sectionsController.createSection);
router.put('/:id', authAdmin, sectionsController.updateSection);
router.delete('/:id', authAdmin, sectionsController.deleteSection);

router.use(errorHandler);

module.exports = router;
