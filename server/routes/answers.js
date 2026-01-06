const express = require('express')
const router = express.Router()
const answersController = require('../controllers/answersController')
const errorHandler = require('../middleware/errorHandler')

router.put('/:id', answersController.updateAnswer)
router.delete('/:id', answersController.deleteAnswer)

router.use(errorHandler)

module.exports = router
