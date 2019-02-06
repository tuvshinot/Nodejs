const User = require('../models/user');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

module.exports = {
    createUser: async function({ userInput }, req) {

        const errors = [];
        if(!validator.isEmail(userInput.email)) {
            errors.push({message: 'E-mail is invalid.'});
        }
        if(validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            errors.push({message: 'Password too short.'});
        }

        if(errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;        
        }

        // const email = args.userInput.email;
        const existingUser = await User.findOne({ email: userInput.email});
        if(existingUser) {
            const err = new Error('User exists with that Email.');
            throw err;
        }

        const hashEdPw = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            name : userInput.name,
            password: hashEdPw  
        })
        const createdUser = await user.save();

        return { ...createdUser._doc, _id: createdUser._id.toString() }
    },
    login : async function({ email, password }) {
        const user = await User.findOne({email : email});
        if(!user) {
            const error = new Error('User not Found');
            error.code = 404;
            throw error;
        }
        const isEqual = bcrypt.compare(password, user.password);
        if(!isEqual) {
            const error = new Error('Password Wrong');
            error.code = 401;
            throw error;
        }

        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'somesuper', 
            { expiresIn: '1h'}
        )
    }
    
};