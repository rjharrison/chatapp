var expect = require('chai').expect,
    sinon = require('sinon');


describe('Socket Handlers', function () {

    describe('init', function () {

        var data = {
            name: 'Richard',
            token: 'abc123'
        };

        var richardMD5 = 'c51c8bbd9e8c8bc49042ccd5d3e9864d';
        var mockSocket;
        var handlers;

        beforeEach(function(){
            // force a new require (need to reset the "users" variable within the module)
            delete require.cache[require.resolve('./handlers')];
            handlers = require('./handlers');

            // define a noop mock object
            mockSocket = {
                join: function (){},
                broadcast: { emit: function (){}},
                emit: function (){}
            };
        });


        it('Should join a channel represented by the MD5 has of the name', function () {
            mockSocket.join = sinon.stub();

            handlers({}, mockSocket).init(data);
            expect(mockSocket.join.called).to.be.true;
            expect(mockSocket.join.calledWith(richardMD5));
            expect(mockSocket.userId).to.be.equal(richardMD5);
        });

        it('Should emit a broadcast event for "userlist" on the first call', function () {
            mockSocket.broadcast.emit = sinon.stub();

            // call init twice for the same "data" (i.e. user connects to two sockets)
            // the broadcast.emit should only be called once (the first time)
            var x = handlers({}, mockSocket);
            x.init(data);
            expect(mockSocket.broadcast.emit.calledOnce).to.be.true;
            x.init(data);
            expect(mockSocket.broadcast.emit.calledOnce).to.be.true;

            // check that it was called with the userlist event + hash containing our user (keyed by "userId" which is the md5 hash)
            expect(mockSocket.broadcast.emit.calledWith('userlist', sinon.match.has(richardMD5))).to.be.true;
        });

        it('Should emit a "connected" event', function () {
            mockSocket.emit = sinon.stub();

            handlers({}, mockSocket).init(data);
            expect(mockSocket.emit.calledOnce).to.be.true;
            expect(mockSocket.emit.calledWith('connected', sinon.match.object, sinon.match.object));
        });
    });
});

