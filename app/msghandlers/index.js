/**
 * Message Handler factory.
 * Probably replace this with a nicer DI library
 */
var validHandlers = ['badwords'];

function Handlers() {}

Handlers.prototype.get = function (handlers) {
    var ret = [];

    [].concat(handlers).forEach(function(v){
        if (!validHandlers.includes(v)) {
            return; // @todo trigger and error - we have a misconfiguration
        }

        // load the handler and push it into the stack
        ret.push(require('./' + v));
    })

    return ret;
}

module.exports = new Handlers();