var expect = require('chai').expect,
    sinon = require('sinon');


describe('Socket Handlers', function () {

    var mockSocket = {},
        mockAuth = {},
        handlers = function(){},
        richardMD5 = 'c51c8bbd9e8c8bc49042ccd5d3e9864d';

    beforeEach(function(){
        // define a no-op mock object
        mockSocket = {
            join: function (){},
            broadcast: { emit: function (){}},
            emit: function (){},
            to: function () { return {emit: function(){}} }
        };

        mockAuth = {
            isTokenValid: function () { return true; },
            canSendMessage: function () { return true; }
        };

        // force a new require (need to reset the "users" variable within the module)
        delete require.cache[require.resolve('./handlers')];
        handlers = require('./handlers');
    });

    describe('init', function () {

        var data = {
            name: 'Richard',
            token: 'abc123'
        };

        it('Should called isTokenValid() to authenticate', function () {
            mockAuth.isTokenValid = sinon.stub();
            handlers({}, mockSocket, [], mockAuth).init(data);
            expect(mockAuth.isTokenValid.calledWith(richardMD5, data.token)).to.be.true;
        });

        it('Should join a channel represented by the MD5 has of the name', function () {
            mockSocket.join = sinon.stub();

            handlers({}, mockSocket, [], mockAuth).init(data);
            expect(mockSocket.join.called).to.be.true;
            expect(mockSocket.join.calledWith(richardMD5));
            expect(mockSocket.userId).to.be.equal(richardMD5);
        });

        it('Should emit a broadcast event for "userlist" on the first call', function () {
            mockSocket.broadcast.emit = sinon.stub();

            // call init twice for the same "data" (i.e. user connects to two sockets)
            // the broadcast.emit should only be called once (the first time)
            var x = handlers({}, mockSocket, [], mockAuth);
            x.init(data);
            expect(mockSocket.broadcast.emit.calledOnce).to.be.true;
            x.init(data);
            expect(mockSocket.broadcast.emit.calledOnce).to.be.true;

            // check that it was called with the userlist event + hash containing our user (keyed by "userId" which is the md5 hash)
            expect(mockSocket.broadcast.emit.calledWith('userlist', sinon.match.has(richardMD5))).to.be.true;
        });

        it('Should emit a "connected" event', function () {
            mockSocket.emit = sinon.stub();

            handlers({}, mockSocket, [], mockAuth).init(data);
            expect(mockSocket.emit.calledOnce).to.be.true;
            expect(mockSocket.emit.calledWith('connected', sinon.match.object, sinon.match.object));
        });
    });


    describe('send message', function () {
        var data;

        beforeEach(function (){
            data = {
                toId: "a",
                fromId: "b",
                message: '',
                token: 'abc123',
            };
        });

        it('Should call auth functions', function () {
            mockAuth.isTokenValid = sinon.stub().returns(true);
            mockAuth.canSendMessage = sinon.stub();

            handlers({}, mockSocket, [], mockAuth).sendMessage(data);
            expect(mockAuth.isTokenValid.calledWith(data.fromId, data.token)).to.be.true;
            expect(mockAuth.canSendMessage.calledWith(data.fromId, data.toId)).to.be.true;
        });

        it('Should iterate over the message handlers and call .execute() on each one', function () {
            var stub = {execute: sinon.stub()},
                msgHandlers = [stub, stub];

            handlers({}, mockSocket, msgHandlers, mockAuth).sendMessage(data)
            expect(stub.execute.calledTwice).to.be.true;
        });

        it('Should encode html entities', function () {
            data.message = '<script>';
            handlers({}, mockSocket, [], mockAuth).sendMessage(data);

            expect(data.message).to.be.equal('&lt;script&gt;');
        });

        it('Should emit a "receive message" to both the sender and recipient', function () {
            var emit = sinon.stub(),
                to = sinon.stub().returns({emit: emit});

            mockSocket.to = to;
            mockSocket.emit = sinon.stub();

            handlers({}, mockSocket, [], mockAuth).sendMessage(data);

            // recipient
            expect(to.calledOnce).to.be.true;
            expect(to.calledWith(data.toId)).to.be.true;
            expect(emit.calledOnce).to.be.true;
            expect(emit.calledWith('receive message', data)).to.be.true;

            // sender
            expect(mockSocket.emit.calledOnce).to.be.true;
            expect(mockSocket.emit.calledWith('receive message', data)).to.be.true;

        });
    });


    describe('disconnect', function () {

        it('Should emit a "userlist" event if this socket means the user has effectively "logged off" (ie no more sockets)', function () {
            var clients = sinon.stub().callsArgWith(0, undefined, [])
                io = {in: sinon.stub().returns({clients: clients})};

            mockSocket.emit = sinon.stub();
            mockSocket.broadcast = {emit: sinon.stub()}

            handlers(io, mockSocket, []).disconnect();

            expect(io.in.calledOnce).to.be.true;

            // emit to client
            expect(mockSocket.emit.calledOnce).to.be.true;
            expect(mockSocket.emit.calledWith('userlist')).to.be.true;

            // broadcast to everyone else
            expect(mockSocket.broadcast.emit.calledOnce).to.be.true;
            expect(mockSocket.broadcast.emit.calledWith('userlist'));
        });

        it('Should not emit a "userlist" event if there are other active sockets for this user', function () {
            var clients = sinon.stub().callsArgWith(0, undefined, ["non-empty array"]),
            io = {in: sinon.stub().returns({clients: clients})};

            mockSocket.emit = sinon.spy();

            expect(mockSocket.emit.notCalled).to.be.true;
        });
    });
});

