const db = require('../lib/arangodb');
const aql = require('arangojs').aql;

async function getDirectedShifts(direction, storage_id) {
  // _key: shift._key : for use as unique key in talbe
  const shifts = await db
    .query(
      aql`FOR shift IN Shift      
          LET product = DOCUMENT(shift.product_id)
          LET nomen = DOCUMENT(product.nomen_id)
          FILTER ${
            direction === 'to'
          } ? shift._to == ${storage_id} : shift._from == ${storage_id}                  
          RETURN {
            _key: shift._key,
            name: nomen.name,
            measure: nomen.measure,             
            product_id: product._id,             
            its: product.its,             
            pack: product.pack,             
            qty: shift.qty,
            seats: shift.seats 
          }`
    )
    .then((cursor) => {
      return cursor.all();
    });
  return shifts;
}

function groupShiftsByProduct(shifts) {
  const products = shifts.reduce((accum, shift) => {
    const productInAccum = accum.find((item) => item.product_id === shift.product_id);
    if (productInAccum) {
      productInAccum.qty = productInAccum.qty + shift.qty;
      productInAccum.seats = productInAccum.seats + shift.seats;
    } else {
      accum.push(shift);
    }
    return accum;
  }, []);
  return products;
}

// todo: учесть случаи когда на складе приемки изменяют кол-во мест
function balance(toProducts, fromProducts) {
  const products = [];
  for (let toProduct of toProducts) {
    let product = toProduct;
    let fromProduct = fromProducts.find(
      (fromProduct) => toProduct.product_id === fromProduct.product_id
    );
    if (fromProduct) {
      product.qty = toProduct.qty - fromProduct.qty;
    }
    products.push(product);
  }

  return products;
}

module.exports = { getDirectedShifts, groupShiftsByProduct, balance };
