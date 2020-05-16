'use strict';
const db = require('../lib/arangodb');

const productsColl = db.collection('Products');

class Product {
  constructor(product) {
    for (const key in product) {
      this[key] = product[key];
    }
  }

  static async create(productData, user) {
    productData.createdBy = user._id;
    productData.createdAt = new Date();
    return (await productsColl.save(productData, true)).new;
  }

  static async get(_key) {
    const product = await productsColl.document(_key);
    return product ? new Product(product) : null;
  }
}

module.exports = Product;
