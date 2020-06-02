'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;

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
    const product = await productsColl.document(_key, { graceful: true });
    return product ? new Product(product) : null;
  }

  static async getByOrderId(order_id) {
    let products = await db
      .query(
        aql`FOR product IN Products
          FILTER product.order_id == ${order_id}
          SORT product.createdAt DESC
          RETURN product`
      )
      .then((cursor) => {
        return cursor.all();
      });
    return products;
  }
}

module.exports = Product;
