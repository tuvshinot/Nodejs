const express = require('express');
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
[
    check('email', 'Invalid email')
        .isEmail()
        .withMessage('Invalid email.'),
        // .normalizeEmail(), // normalize lowercase and cooler feature
    check('password', 'password must be at least 5 characters and alphanumeric.')
        .isAlphanumeric()
        .isLength({min: 5})
        .trim() // remove spaces
]
, authController.postLogin);

router.post('/signup', 
[
    check('email')
        .isEmail()
        .withMessage('Insert Valid Email!')
        .custom((value, { req }) => {
            // if(value.includes('$')) {
            //     throw new Error('Can not contain $ simbol');
            // }
            // return true;
            return User.findOne({email: value})
            // async validation
            .then(userDoc => { // if there is no user just return so it is true
                if(userDoc) { // if there is user is will reject it.
                    return Promise.reject('Email exists already, please pick different one!. ');
                }
            });
        })
        .normalizeEmail(),
    body('password', 'Please choose password text and number at least 5 characters.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .custom((value, { req }) => {
            if(value !== req.body.password) {
                throw new Error('Password does not match!');
            }
            return true;
        })
        .trim()
], 
authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;