const express = require('express');
const router = express.Router();
const filialController = require('../controllers/branchController');

router.get('/', filialController.get_filiais);
router.get('/init', filialController.init_filiais); // Temporary - TODO: endpoint that initializes the entire database (in server.js)
router.get('/:nipc', filialController.get_filial_by_nipc);
router.post('/', filialController.post_filial);
router.put('/:nipc', filialController.update_filial);
router.delete('/:nipc', filialController.delete_filial);

module.exports = router;
