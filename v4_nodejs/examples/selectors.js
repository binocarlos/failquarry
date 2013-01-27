var parser = require('../lib/selector');

var contract = parser(' > * product.onsale[price<100] > img caption.red, friend');

console.log(JSON.stringify(contract, null, 4));
