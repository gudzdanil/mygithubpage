(function() {
    angular.module('es360', [])
        .run(['PubNubService', function(PubNubService) {
            PubNubService.init();
        }])
        .service('PubNubService', PubNubService)
        .component('app', {
            templateUrl: '/templates/app.html',
            controller: AppController
        })
        .component('message', {
            bindings: {
                message: '<'
            },
            templateUrl: '/templates/message.html'
        })
        .component('sendForm', {
            templateUrl: '/templates/form.html'
        })
        .component('map', {
            bindings: {
                userCoords: '<',
                lastUserCoord: '<'
            },
            templateUrl: '/templates/map.html'
        });

    function AppController(PubNubService) {
        PubNubService.getHistory().then(angular.bind(this, function(response) {

        }));
        PubNubService.getOnlineUsers().then(angular.bind(this, function(response) {

        }));
    }
    AppController.$inject = ['PubNubService'];

    function PubNubService($rootScope, $q) {
        this._rootScope = $rootScope;
        this._q = $q;
    }
    PubNubService.$inject = ['$rootScope', '$q'];

    PubNubService.prototype.init = initPubNub;
    PubNubService.prototype._initListener = initListener;
    PubNubService.prototype._getListener = getListener;
    PubNubService.prototype.publish = publish;
    PubNubService.prototype.getOnlineUsers = getOnlineUsers;
    PubNubService.prototype.getHistory = getHistory;

    function getHistory() {
        return this._q(angular.bind(this, function(res, rej) {
            this._pubnub.history(
                {
                    channel: 'chat',
                    reverse: true, // Setting to true will traverse the time line in reverse starting with the oldest message first.
                },
                function (status, response) {
                    console.log('history', status, response);
                    if(status.statusCode !== 200) {
                        rej(status);
                    }
                    res(response.messages);
                }
            );
        }));
    }

    function getOnlineUsers() {
        return this._q(angular.bind(this, function(res, rej) {
            this._pubnub.hereNow(
                {
                    channels: ["chat"],
                    includeUUIDs: true,
                    includeState: true
                },
                function (status, response) {
                    console.log('here now', status, response);
                    res(response);
                }
            );
        }));
    }

    function publish(message) {
        this._pubnub.publish(
            {
                message: message,
                channel: 'chat',
                sendByPost: false, // true to send via post
                storeInHistory: true //override default storage options
            },
            function (status, response) {
                // handle status, response
                console.log('publish response', arguments);
            }
        );
    }

    function initPubNub() {
        this._pubnub = new PubNub({
            subscribeKey: "sub-c-e622b4f8-d7d4-11e6-baae-0619f8945a4f",
            publishKey: "pub-c-f9081d4e-f107-4d19-85f7-b453dbc9b13e",
            ssl: true
        });

        this._initListener();
    }

    function initListener() {
        if(!this._pubnub) {
            return;
        }
        this._pubnub.addListener(this._getListener);
    }

    function getListener() {
        return this._listener || (this._listener = {
            message: angular.bind(this, function (m) {
                // handle message
                // var channelName = m.channel; // The channel for which the message belongs
                // var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
                // var pubTT = m.timetoken; // Publish timetoken
                // var msg = m.message; // The Payload
                console.log('message', m);
                this._rootScope.$broadcast('message', m.message);
            }),
            presence: angular.bind(this, function (p) {
                // handle presence
                // var action = p.action; // Can be join, leave, state-change or timeout
                // var channelName = p.channel; // The channel for which the message belongs
                // var occupancy = p.occupancy; // No. of users connected with the channel
                // var state = p.state; // User State
                // var channelGroup = p.subscription; //  The channel group or wildcard subscription match (if exists)
                // var publishTime = p.timestamp; // Publish timetoken
                // var timetoken = p.timetoken;  // Current timetoken
                // var uuid = p.uuid; // UUIDs of users who are connected with the channel
                console.log('user', p);
                this._rootScope.$broadcast('user', p);
            }),
            status: angular.bind(this, function (s) {
                // handle status
                console.log('status', s);
                this._rootScope.$broadcast('status', s);
            })
        });
    }
})();