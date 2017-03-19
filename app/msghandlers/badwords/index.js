
// attempting to precompile/cache the regex. Not 100% sure this is the best/right way to do this, but conscious that
// depending on the future complexity of the regex here you would really only want to do it once and then reuse
var regex;
function getBadwordsRegex() {
    var badwords = ['okcupid', 'match.com', 'eharmony'];

    if (regex == undefined) {
        regex = new RegExp(badwords.join('|'), 'gi');
    }

    return regex;
}


function Badwords() {}

Badwords.prototype.execute = function(data) {
    data.message = data.message.replace(getBadwordsRegex(), '*****');
}

module.exports = new Badwords();