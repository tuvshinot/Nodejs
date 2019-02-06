const path = require('path');
const express = require('express');
const shopController = require('../controllers/shop');
const router = express.Router();

router.get('/', shopController.getIndex);
router.get('/products', shopController.getProducts);
// get cart element
router.get('/cart', shopController.getCart);
// add to shop
router.post('/cart', shopController.postCart);
// remove from cart
router.post('/cart-delete-item', shopController.postCartDeleteProduct);
router.get('/orders', shopController.getOrders);
router.get('/checkout', shopController.getCheckout);
router.get('/products/:productId', shopController.getProduct);



module.exports = router;
