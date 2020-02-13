'use strict';

exports = module.exports = function (req, res, cb) {
	res.data	= {'this is': 'broken'};
	cb(new Error('You are Hacked'));
};
