const express = require('express');
const router = express.Router();
const initController = require('../controllers/initController');

router.get('/initDataBase', initController.init_database);

module.exports = router;
