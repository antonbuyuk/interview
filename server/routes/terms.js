const express = require('express')
const router = express.Router()
const termsController = require('../controllers/termsController')
const errorHandler = require('../middleware/errorHandler')

router.get('/', termsController.getTerms)
router.get('/:id', termsController.getTermById)
router.post('/', termsController.createTerm)
router.put('/:id', termsController.updateTerm)
router.delete('/:id', termsController.deleteTerm)

router.use(errorHandler)

module.exports = router
