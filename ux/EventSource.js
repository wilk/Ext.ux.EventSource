/**
 * @class Ext.ux.EventSource
 * @author Vincenzo Ferrari <wilk3ert@gmail.com>
 *
 * Wrapper for HTML5 EventSource
 *
 * This class provide an interface for HTML5 EventSource.
 *
 * <h1>Pure text communication</h1>
 * The communication is text-only, without objects or any other kind of data.
 *
 *     var eventsource = Ext.create ('Ext.ux.EventSource', {
 *       url: 'sse.php' ,
 *       listeners: {
 *         open: function (es) {
 *           console.log ('The EventSource is ready to use');
 *         } ,
 *         close: function (es) {
 *           console.log ('The EventSource is closed!');
 *         } ,
 *         error: function (es, error) {
 *           Ext.Error.raise (error);
 *         } ,
 *         message: function (es, message) {
 *           console.log ('A new message is arrived: ' + message);
 *         }
 *       }
 *     });
 *
 * <h1>Pure event-driven communication</h1>
 * The communication is event-driven: an event and a String or Object are sent and the EventSource handles different events.
 *
 *     var eventsource = Ext.create ('Ext.ux.EventSource', {
 *       url: 'sse.php' ,
 *       listeners: {
 *         open: function (es) {
 *           console.log ('The EventSource is ready to use');
 *         } ,
 *         close: function (es) {
 *           console.log ('The EventSource is closed!');
 *         }
 *       }
 *     });
 *
 *     // A 'stop' event is sent from the server
 *     // 'data' has 'cmd' and 'msg' fields
 *     eventsource.on ('stop', function (data) {
 *       console.log ('Command: ' + data.cmd);
 *       console.log ('Message: ' + data.msg);
 *     });
 *
 * <h1>Mixed event-driven and text communication</h1>
 * The communication is mixed: it can handles text-only and event-driven communication.
 *
 *     var eventsource = Ext.create ('Ext.ux.EventSource', {
 *       url: 'sse.php' ,
 *       listeners: {
 *         open: function (es) {
 *           console.log ('The EventSource is ready to use');
 *         } ,
 *         close: function (es) {
 *           console.log ('The EventSource is closed!');
 *         } ,
 *         message: function (es, message) {
 *           console.log ('Text-only message arrived is: ' + message);
 *         }
 *       }
 *     });
 *
 *     // A 'stop' event is sent from the server
 *     // 'data' has 'cmd' and 'msg' fields
 *     eventsource.on ('stop', function (data) {
 *       console.log ('Command: ' + data.cmd);
 *       console.log ('Message: ' + data.msg);
 *     });
 */

Ext.define ('Ext.ux.EventSource', {
    alias: 'widget.eventsource' ,

    mixins: {
        observable: 'Ext.util.Observable'
    } ,

    requires: ['Ext.util.TaskManager'] ,

    config: {
        /**
         * @cfg {String} url (required) The URL to connect
         */
        url: '' ,

        /**
         * @cfg {String} communicationType The type of communication. 'both' (default) for event-driven and pure-text communication, 'event' for only event-driven and 'text' for only pure-text.
         */
        communicationType: 'both' ,

        /**
         * @cfg {Boolean} autoReconnect If the connection is closed by the server, it tries to re-connect again. The execution interval time of this operation is specified in autoReconnectInterval
         */
        autoReconnect: true ,

        /**
         * @cfg {Int} autoReconnectInterval Execution time slice of the autoReconnect operation, specified in milliseconds.
         */
        autoReconnectInterval: 5000
    } ,

    /**
     * @property {Number} CONNECTING
     * @readonly
     * The connection is not yet open.
     */
    CONNECTING: 0 ,

    /**
     * @property {Number} OPEN
     * @readonly
     * The connection is open and ready to communicate.
     */
    OPEN: 1 ,

    /**
     * @property {Number} CLOSING
     * @readonly
     * The connection is in the process of closing.
     */
    CLOSING: 2 ,

    /**
     * @property {Number} CLOSED
     * @readonly
     * The connection is closed or couldn't be opened.
     */
    CLOSED: 3 ,

    /**
     * Creates new EventSource
     * @param {String/Object} config The configuration options may be specified as follows:
     *
     *     // with a configuration set
     *     var config = {
	 *       url: 'your_url'
	 *     };
     *
     *     var es = Ext.create ('Ext.ux.EventSource', config);
     *
     *     // or with eventsource url only
     *     var es = Ext.create ('Ext.ux.EventSource', 'sse.php');
     *
     * @return {Ext.ux.EventSource} An instance of Ext.ux.EventSource or null if an error occurred.
     */
    constructor: function (cfg) {
        var me = this;

        // Raises an error if no url is given
        if (Ext.isEmpty (cfg)) {
            Ext.Error.raise ('URL for the EventSource is required!');
            return null;
        }

        // Allows initialization with string
        // e.g.: Ext.create ('Ext.ux.EventSource', 'sse.php');
        if (typeof cfg === 'string') {
            cfg = {
                url: cfg
            };
        }

        me.initConfig (cfg);
        me.mixins.observable.constructor.call (me, cfg);

        me.addEvents (
            /**
             * @event open
             * Fires after the eventsource has been connected.
             * @param {Ext.ux.EventSource} this The eventsource
             */
            'open' ,

            /**
             * @event error
             * Fires after an error occured
             * @param {Ext.ux.WebSocket} this The websocket
             * @param {Object} error The error object to display
             */
            'error' ,

            /**
             * @event close
             * Fires after the eventsource has been disconnected.
             * @param {Ext.ux.EventSource} this The eventsource
             */
            'close' ,

            /**
             * @event message
             * Fires after a message is arrived from the server.
             * @param {Ext.ux.EventSource} this The eventsource
             * @param {String/Object} message The message arrived
             */
            'message'
        );

        try {
            // Initializes internal eventsource
            me.init ();
        }
        catch (err) {
            Ext.Error.raise (err);
            return null;
        }

        return me;
    } ,

    /**
     * @method isReady
     * Returns if the eventsource connection is up or not
     * @return {Boolean} True if the connection is up, False otherwise
     */
    isReady: function () {
        return (this.getStatus () === this.OPEN ? true : false);
    } ,

    /**
     * @method getStatus
     * Returns the current status of the eventsource
     * @return {Number} The current status of the eventsource (0: connecting, 1: open, 2: closed)
     */
    getStatus: function () {
        return this.es.readyState;
    } ,

    /**
     * @method close
     * Closes the eventsource and kills the autoreconnect task, if exists
     */
    close: function () {
        var me = this;

        if (me.autoReconnectTask) {
            Ext.TaskManager.stop (me.autoReconnectTask);
            delete me.autoReconnectTask;
        }
        me.es.close ();

        return me;
    } ,

    /**
     * @method init
     * Internal eventsource initialization
     * @private
     */
    init: function () {
        var me = this;

        if (typeof EventSource === 'undefined' || EventSource === null) throw 'Ext.ux.EventSource: your browser does not support HTML5 EventSource.';

        me.es = new EventSource (me.getUrl ());

        me.es.onopen = function () {
            // Kills the auto reconnect task
            // It will reactivated at the next onclose event
            if (me.autoReconnectTask) {
                Ext.TaskManager.stop (me.autoReconnectTask);
                delete me.autoReconnectTask;
            }

            me.fireEvent ('open', me);
        };

        me.es.onerror = function (error) {
            me.fireEvent ('error', me, error);
        };

        me.es.onclose = function () {
            me.fireEvent ('close', me);

            // Setups the auto reconnect task, just one
            if (me.getAutoReconnect () && (typeof me.autoReconnectTask === 'undefined')) {
                me.autoReconnectTask = Ext.TaskManager.start ({
                    run: function () {
                        // It reconnects only if it's disconnected
                        if (me.getStatus () === me.CLOSED) {
                            me.init ();
                        }
                    } ,
                    interval: me.getAutoReconnectInterval ()
                });
            }
        };

        if (me.getCommunicationType () === 'both') {
            me.es.onmessage = Ext.bind (me.receiveBothMessage, this);
        }
        else if (me.getCommunicationType () === 'event') {
            me.es.onmessage = Ext.bind (me.receiveEventMessage, this);
        }
        else {
            me.es.onmessage = Ext.bind (me.receiveTextMessage, this);
        }
    } ,

    /**
     * @method receiveBothMessage
     * It catches every event-driven and pure text messages incoming from the server
     * @param {Object} message Message incoming from the server
     * @private
     */
    receiveBothMessage: function (message) {
        var me = this ,
            msg = '';

        // @todo: change try/catch flow into a more linear check
        try {
            // message.data : JSON encoded message
            msg = Ext.JSON.decode (message.data);
        }
        catch (err) {
            if (Ext.isString (message.data)) msg = message.data;
        }

        if (!Ext.isEmpty (message.event)) me.fireEvent (message.event, me, msg);
        // Message event is always sent
        me.fireEvent ('message', me, msg);
    } ,

    /**
     * @method receiveEventMessage
     * It catches every event-driven messages incoming from the server
     * @param {Object} message Message incoming from the server
     * @private
     */
    receiveEventMessage: function (message) {
        var me = this;

        try {
            var msg = Ext.JSON.decode (message.data);
            if (!Ext.isEmpty (message.event)) me.fireEvent (message.event, me, msg);
            me.fireEvent ('message', me, msg);
        }
        catch (err) {
            Ext.Error.raise (err);
        }
    } ,

    /**
     * @method receiveTextMessage
     * It catches every pure text messages incoming from the server
     * @param {Object} message Message incoming from the server
     * @private
     */
    receiveTextMessage: function (message) {
        var me = this;

        try {
            me.fireEvent (message.data, me, message.data);
            // Message event is always sent
            me.fireEvent ('message', me, message.data);
        }
        catch (err) {
            Ext.Error.raise (err);
        }
    }
});
