requirejs.config({
    baseUrl: 'js/lib',
    paths: {
        chat: '../chat'
    }
});

requirejs(['chat/ChatApp'], function(ChatApp) {

    var chatApp = new ChatApp({
        el: '.js-chatapp',
        socketUrl: '/'
    })

});

