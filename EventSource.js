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
 *     eventsource.on ('stop', function (es, data) {
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
 *     eventsource.on ('stop', function (es, data) {
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
        url: ''
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

        me.es.close ();
        me.fireEvent ('close', me);

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
            me.fireEvent ('open', me);
            
            // Attaches those events that weren't attached before
			for (var event in me.events) {
				me.attachEvent (event);
			}
        };

        me.es.onerror = function (error) {
            me.fireEvent ('error', me, error);
        };
        
        me.es.onclose = function () {
        	me.fireEvent ('close', me);
        };
        
        me.es.onmessage = Ext.bind (me.receiveMessage, this);
    } ,
    
    /**
     * @method receiveMessage
     * It decodes the data sent from the server and it fires the appropriate event
     * @param {EventSource} message The EventSource HTML5 object that contains every information
     * @param {String} event (optional) The event sent from the server. Default: 'message'
     * @private
     */
    receiveMessage: function (message, event) {
    	var me = this ,
    		msg = Ext.JSON.decode (message.data, true);
    	
    	if (Ext.isEmpty (msg)) msg = message.data;
    	
    	event = event || 'message';
    	me.fireEvent (event, me, msg);
    } ,
    
    /**
     * @method attachEvent
     * It attaches the given event to the EventSource object. Actually, this is a proxy to make EventSource object observable by ExtJS
     * @param {String} event The event to listen to
     * @private
     */
    attachEvent: function (event) {
    	var me = this;
    	
    	if (!me.hasListener (event)) {
			me.es.addEventListener (event, function (message) {
				me.receiveMessage (message, event);
			});
		}
    } ,
    
    /**
     * @method detachEvent
     * It detaches the given event to the EventSource object.
     * @param {String} event The event to remove
     * @private
     */
    detachEvent: function (event) {
    	var me = this;
    	
    	if (me.hasListener (event)) {
    		// @todo: this could be a bug. There's no function given from the user associated at the EventSource object
			me.es.removeEventListener (event, function (message) {
				me.receiveMessage (message, event);
			});
		}
    } ,
    
    /**
     * @method addListener
     * Ext.util.Observable.addListener method overridden to make the EventSource internal object observable.
     * See the original docs for the parameters.
     */
    addListener: function (event, fn, scope, options) {
    	var me = this;

		if (!Ext.isEmpty (me.es)) {
			if (typeof event === 'string') {
				me.attachEvent (event);
			}
			else {
				for (var eventName in event) {
					me.attachEvent (eventName);
				}
			}
		}

		me.mixins.observable.addListener.apply (me, arguments);
    } ,
    
    /**
     * @method removeListener
     * Ext.util.Observable.removeListener method overridden to make the EventSource internal object observable.
     * See the original docs for the parameters.
     */
	removeListener: function (event, fn, scope, options) {
    	var me = this;

		if (!Ext.isEmpty (me.es)) {
			if (typeof event === 'string') {
				me.detachEvent (event);
			}
			else {
				for (var eventName in event) {
					me.detachEvent (eventName);
				}
			}
		}

		me.mixins.observable.removeListener.apply (me, arguments);
	}
});
