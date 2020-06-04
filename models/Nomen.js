'use strict';
const db = require('../lib/arangodb');

const nomensColl = db.collection('Nomen');

class Nomen {
  constructor(nomen) {
    this._id = nomen._id;
    this.tnved = nomen.tnved;
    this.name = nomen.name;
    this.measure = nomen.measure;
    this.comment = nomen.comment;
  }

  static async create(nomenData, user) {
    nomenData.createdBy = user._id;
    nomenData.createdAt = new Date();
    return (await nomensColl.save(nomenData, true)).new;
  }

  static async findByName(name) {
    let nomen = await nomensColl.byExample({ name }).then((cursor) => cursor.next());
    return nomen ? new Nomen(nomen) : null;
  }

  static async getOrCreate(nomenData, user) {
    let nomen;
    nomen = await Nomen.findByName(nomenData.name);
    if (!nomen) {
      nomen = Nomen.create(nomenData, user);
    }
    return nomen;
  }

  static async get(_key) {
    const nomen = await nomensColl.document(_key);
    return nomen ? new Nomen(nomen) : null;
  }
}

module.exports = Nomen;
