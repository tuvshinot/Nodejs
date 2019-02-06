const { validationResult } = require('express-validator/check');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const io = require('../socket');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post
        .find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post
                .find()
                .populate('creator')
                .sort({createdAt: -1})
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(posts => {
            res
            .status(200)
            .json({message: 'fetched posts successfully.', posts: posts, totalItems: totalItems });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

   
    
};

exports.createPost = (req, res, next) => {
    
    const errors = validationResult(req);
    
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode(422);
        throw error;
    }

    if(!req.file) {
        const error = new Error('image is not uploaded.');
        error.statusCode(422);
        throw error;
    }


    // for windows only || or just path
    const imageUrl = req.file.path.replace("\\" ,"/");
    const title = req.body.title;
    const content = req.body.content;
    let creator;

    const post = new Post({
        title: title, 
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    post
        .save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(user => {
            // console.log(user);
            io.getIO().emit('posts', { action: 'create', post: {...post._doc, creator: {_id: req.userId, name: user.name}} });
            res.status(201).json({ 
                message: "Succesfully Created.",
                post: post
            });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post
        .findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Post not found.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({message: 'Post Fetched!', post: post});
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

    const errors = validationResult(req);
    
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode(422);
        throw error;
    }

     const title = req.body.title;
     const content = req.body.content;
     let imageUrl = req.body.image;
    
     if(req.file) {
        // for windows only || or just path
        imageUrl = req.file.path.replace("\\" ,"/");
     }

     if(!imageUrl) {
         const error = new Error('Image not uploaded');
         error.statusCode = 422;
         throw error;
     }

     Post
        .findById(postId)
        .populate('creator')
        .then(post => {
            // console.log(post);
            if(!post) {
                const error = new Error('Post not found.');
                error.statusCode = 404;
                throw error;
            }

            if(post.creator._id.toString() !== req.userId) {
                const error = new Error('Not Authorized.');
                error.statusCode = 403;
                throw error;
            } 

            if(imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }

            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;

            return post.save();
        })
        .then(result => {
            io.getIO().emit('posts', {action: 'update', post: result})
            res.status(200).json({message: 'Post updated!', post: result});
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
     
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;

    Post
        .findById(postId)
        .then(post => {
            if(!post) {
                const error = new Error('Post not found.');
                error.statusCode = 404;
                throw error;
            }

            // checking authorization
            if(post.creator.toString() !== req.userId) {
                const error = new Error('Not Authorized.');
                error.statusCode = 403;
                throw error;
            }

            clearImage(post.imageUrl);
            return Post.findByIdAndDelete(postId);
        })
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            io.getIO().emit('posts', {action: 'delete', post: postId})
            res.status(200).json({message: 'Deleted!'});
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getStatus = (req, res, next) => {
    User
    .findById(req.userId)
    .then(user => {
        res.status(200).json({status: user.status});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 404;
        }
        next(err);
    })
};

exports.updateStatus = (req, res, next) => {
    const newStatus = req.body.status;
    User
    .findById(req.userId)
    .then(user => {
        user.status  = newStatus;
        return user.save();
    })
    .then(user => {
        res.status(200).json({ message: 'Status Updated.!'});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 403;
        }
        next(err);
    })
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};