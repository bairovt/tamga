'use strict';
const db = require('../lib/arangodb');
const { packTypes, measureUnits } = require('../consts');

const nomensColl = db.collection('Nomens');

class Nomen {
  constructor(user) {
    this._id = user._id;
    this.tnved = user.tnved;
    this.name = user.name;
    this.measure = user.measure;
    this.comment = user.comment;
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
