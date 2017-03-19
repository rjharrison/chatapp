var expect = require('chai').expect;
var handlers = require('./index');

describe('Message Handler injection', function () {

    it('get() should return array of handlers', function () {
        var ret = handlers.get(['badwords']);

        expect(ret).to.be.an('array');
        expect(ret).to.have.lengthOf(1);
    });

    it('Should not allow invalid handlers to be required', function () {
       var ret = handlers.get(['some/other/thing']);
       expect(ret).to.be.an('array');
       expect(ret).to.have.lengthOf(0);
    });
});

