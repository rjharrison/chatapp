define(function(){
    return Backbone.View.extend({
        rendered: false,
        chattingWith: '',
        user: {},

        // <ul> for nav, <div> for tabs
        mainTemplate: _.template(
            '<ul class="nav nav-tabs js-tab-nav" role="tablist"></ul><div class="tab-content js-tab-content"></div>' +
            '<div class="js-chat-inout chat-input"><input width="" class="js-chat-message" /><input type="button" class="js-chat-send btn btn-primary" value="Send"/> </div>'
        ),

        // tab header
        navTemplate: _.template('<li role="presentation"><a data-userId="<%= userId %>" href="#chat-<%= userId %>" aria-controls="home" role="tab" data-toggle="tab"><%= name %></a></li>'),

        // tab content
        contentTemplate:  _.template('<div role="tabpanel" class="tab-pane" id="chat-<%= userId %>"><div class="js-chat-content"></div></div>'),

        // message template
        messageTemplate: _.template('<div class="message <%= msgClass %>"><span class="name"><%= fromName %>:</span> <%= message %> </div>'),

        events: {
            'click .js-chat-send': 'sendMessage'
        },

        initialize: function (options) {
            // we pass the "logged in user" object from the parent view into the child
            this.user = options.user;
        },

        render: function () {
            this.rendered = true;
            this.$el.html(this.mainTemplate());

            this.$el.on('show.bs.tab', 'a[data-toggle="tab"]', function (e) {
                this.chattingWith = $(e.target).data('userid');
            }.bind(this));
        },

        openChat: function(userId, name) {
            // ensure tab is created
            this.createTab(userId, name);

            // focus the tab
            this.$('a[href="#chat-' + userId + '"]').tab('show');
            this.chattingWith = userId;
        },

        // Create a chat tab (only if it doesn't already exist)
        createTab: function(userId, name) {
            if (!this.rendered) {
                this.render();
            }

            var $chatTab = this.$('#chat-' + userId);
            if ($chatTab.length == 0) {
                // if the chat tab doesn't exist yet, create one
                $('.js-tab-nav').append(this.navTemplate({userId: userId, name: name}));
                $('.js-tab-content').append(this.contentTemplate({userId: userId}));
            }
        },

        sendMessage: function () {
            var $message = this.$('.js-chat-message'),
                messageText = $message.val();

            if (!messageText) { return; }

            // trigger an event (to be caught by the parent view)
            this.trigger('send-message', this.chattingWith, messageText);

            // reset the text input
            $message.val('');
        },

        receiveMessage: function (data) {
            // are we receiving a message we sent to someone else, or a message someone else sent to us?
            var isFromSelf = data.fromId == this.user.userId;

            // the tab to update
            var targetId = isFromSelf ? data.toUser.userId : data.fromUser.userId;
            var targetName = isFromSelf ? data.toUser.name : data.fromUser.name;

            // ensure there is a chat tab created to inject the message into
            // - if we're not currently chatting with anyone, trigger the openChat() function
            if (!this.chattingWith) {
                this.openChat(targetId, targetName);
            } else {
                this.createTab(targetId, targetName);
            }

            // update the appropriate message pane content with the incoming message
            var $targetTab = $('#chat-' + targetId);
            $targetTab
                .append(this.messageTemplate({
                    msgClass: isFromSelf ? 'self' : 'other',
                    fromName: data.fromUser.name,
                    message: data.message
                }));

            // ensure the last line of chat is visible
            var element = $targetTab.get(0);
            element.scrollTop = element.scrollHeight;

            // @todo make the nav tab flash if not current active chat tab
        }
    });
})