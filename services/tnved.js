const db = require('../lib/arangodb');

async function tnvedItsUpdateOrCreate(tnved, its, user) {
  const tnvedColl = db.collection('Tnved');
  let doc = undefined;
  try {
    doc = await tnvedColl.firstExample({ tnved });
  } catch (error) {
    if (error.code !== 404) throw error;
  }
  if (!doc) {
    await tnvedColl.save({
      tnved,
      its,
      updatedAt: new Date(),
      updatedBy: user._id,
    });
  } else if (doc.its !== its) {
    await tnvedColl.update(doc, {
      its,
      updatedAt: new Date(),
      updatedBy: user._id,
    });
  }
}

module.exports = { tnvedItsUpdateOrCreate };
