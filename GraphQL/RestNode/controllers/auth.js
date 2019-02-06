const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');

exports.signUp = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty) {
        const err = new Error('Validation failed');
        err.statusCode = 422;
        err.data = errors.array();
        throw err;
    }

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    bcrypt
        .hash(password, 12)
        .then(hashedPw => {
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            });
            return user.save();
        })
        .then(result => {
            res.status(200).json({ message: 'User Created?', userId: result._id });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    User.findOne({ email: email })
    .then(user => {
        if(!user) {
            const err = new Error('User not found.');
            err.statusCode = 401;
            throw err;
        }

        loadedUser = user;
        return bcrypt.compare(password, user.password)
    })
    .then(isEqual => {
        if(!isEqual) {
            const err = new Error('Wrong password.');
            err.statusCode = 401;
            throw err;
        }

        const token = jwt.sign({ 
            email: loadedUser.email, 
            userId: loadedUser._id.toString() 
        }, 'somesupersecretsecret', 
        { expiresIn: '1h' });
        
        res.status(200).json({ token: token, userId: loadedUser._id.toString()  });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};