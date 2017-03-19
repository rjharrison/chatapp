var expect = require('chai').expect;
var auth = require('./index');

var validToken = 'abc123',
    invalidToken = 'anythingelse',
    userId = 1;

describe('Auth module', function () {

    it('Should return false if the token is not valid', function () {
        expect(auth.isTokenValid(userId, invalidToken)).to.be.false;
    });

    it('Should return true if the token is valid', function () {
        expect(auth.isTokenValid(userId, validToken)).to.be.true;
    })
});

