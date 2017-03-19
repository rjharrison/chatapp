var expect = require('chai').expect;

var badwords = require('./index');
var knownBadwords = ['okcupid', 'eharmony', 'match.com'];
var expectedReplacement = '*****';

var execute = function (string) {
    var data = {message: string};
    badwords.execute(data);
    return data.message;
};

describe('Badwords filter', function () {

    it('Should replace all matched badwords', function () {
        var string = 'Find my profile on okcupid or match.com';
        expect(execute(string)).to.be.equal('Find my profile on ***** or *****');
    });

    it('Should return the same string if no badwords are found', function () {
        var cleanString = 'this is a clean string';
        expect(execute(cleanString)).to.be.equal(cleanString);
    });

    it('Should replace badwords with asterisk characters', function () {
        knownBadwords.forEach(function(word){
            expect(execute(word)).to.be.equal(expectedReplacement);
        });
    });

    it('Should be case insensitive', function () {
        expect(execute(knownBadwords[0].toUpperCase())).to.be.equal(expectedReplacement);
    });
    
});

