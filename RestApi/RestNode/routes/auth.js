const express = require('express');
const router = express.Router();
const { body } = require('express-validator/check');
const authController = require('../controllers/auth');

const User = require('../models/user');


router.put('/signup', 
[
    body('email')
        .isEmail()
        .withMessage('Please Enter Valid Email')
        .custom((value, { req }) => {
            return User
                .findOne({ email: value })
                .then(userDoc => {
                    if(userDoc) {
                        return Promise.reject('Email address already exists.');
                    }
                })
        }),
    body('password')
        .trim()
        .isLength({ min: 5 }),
    body('name')
        .trim()
        .not()
        .isEmpty()
], 
authController.signUp);

router.post('/login', authController.login);

module.exports = router;