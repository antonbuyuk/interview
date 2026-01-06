const express = require('express')
const router = express.Router()
const sectionsController = require('../controllers/sectionsController')
const errorHandler = require('../middleware/errorHandler')

router.get('/', sectionsController.getSections)
router.get('/:id', sectionsController.getSectionById)

router.use(errorHandler)

module.exports = router
