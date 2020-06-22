'use strict';
const db = require('../lib/arangodb');
const CustomError = require('../lib/custom-error');

const nomenColl = db.collection('Nomen');

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
    return (await nomenColl.save(nomenData, true)).new;
  }

  static async findByName(name) {
    let nomen = await nomenColl.byExample({ name }).then((cursor) => cursor.next());
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

  static async getOr404(handle) {
    const nomen = await nomenColl.document(handle, { graceful: true });
    if (!nomen) throw CustomError(404, `Nomenclature ${productData.nomen_id} not found`);
    return nomen;
  }
}

module.exports = Nomen;
