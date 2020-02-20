'use strict';

const assert = require('assert');
const http = require('http');

const server = require('../server');

describe('server', function () {
    before(function () {
        server.listen(8000);
    });

    it('http://localhost:8000/api/ should return 200', function (done) {
        http.get('http://localhost:8000/api/', function (res) {
            assert.equal(200, res.statusCode);
            done();
        });
    });

    after(function () {
        server.close();
    });
});
