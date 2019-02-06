const fs = require('fs');
const path = require('path');
const Product = require('./product');

const p = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'cart.json'
  );


module.exports = class Cart {
    static addProduct(id, productPrice) {
        //fetch the previous cart
        fs.readFile(p, (err, fileContent) => {
            let cart = {products : [], totalPrice : 0};
            if(!err) {
                cart = JSON.parse(fileContent);
            }
            // analyze the cart 
            const existingProduct = cart.products.find(prod => prod.id === id);
            if(existingProduct) {
                existingProduct.qty++; 
            } else {
                cart.products.push({id: id, qty : 1});
            }
            cart.totalPrice += productPrice;
            fs.writeFile(p, JSON.stringify(cart) , err => {
                console.log(err);
            });
        });
    }
    static deleteProduct(id, productPrice) {
        fs.readFile(p, (err, fileContent) => {
            if(err) {
                return;
            }
            const cart = JSON.parse(fileContent);
            const updatedCart = {...cart};            
            const product = updatedCart.products.find(prod => prod.id === id);
           
            // if product is not in cart
            if(!product) {
                return;
            }
            const productQty = product.qty;
            updatedCart.products = cart.products.filter(prod => prod.id !== id);
            updatedCart.totalPrice = updatedCart.totalPrice - (productPrice * productQty);
            fs.writeFile(p, JSON.stringify(updatedCart) , err => {
                console.log(err);
            });
        });
    }

    static getCart(cb) {
        fs.readFile(p, (err, fileContent) => {
            const cart = JSON.parse(fileContent);
            if(err) {
                cb(null);
            } else {
                cb(cart);
            }
        });
    }
}

