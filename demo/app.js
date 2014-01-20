var express = require ('express') ,
    app = express () ,
    _ = require ('underscore') ,
    // Convert an object into a like-JSON string
    obj2str = function (key, val) {
        var msg = '"' + key + '":';
        if (_.isObject (val)) {
            _.each (val, function (v, k) {
                msg += '{' + obj2str (k, v) + '}';
            });
        }
        else if (_.isArray (val)) {
            msg += '[' + val.join (',') + ']';
        }
        else msg += '"' + val + '"';

        return msg;
    } ,
    // Convert an object into a SSE response
    obj2SSE = function (obj) {
        var msg = '';

        if (_.isString (obj)) msg = 'data:' + obj + "\n";
        else if (_.isObject (obj) && !_.isUndefined (obj) && !_.isNull (obj)) {
            if (!_.isUndefined (obj.id) && !_.isNull (obj.id)) msg += 'id:' + obj.id + "\n";
            if (!_.isUndefined (obj.event) && !_.isNull (obj.event)) msg += 'event:' + obj.event + "\n";
            if (_.isNumber (obj.retry)) msg += 'retry:' + obj.retry + "\n";

            if (!_.isUndefined (obj.data) && !_.isNull (obj.data)) {
                if (_.isObject (obj.data)) {
                    msg += 'data: {';

                    var msgs = [];
                    _.each (obj.data, function (val, key) {
                        msgs.push (obj2str (key, val));
                    });

                    msg += msgs.join (',') + "}\n";
                }
                else if (_.isArray (obj.data)) {
                    msg += 'data:[' + obj.data.split (',') + "]\n";
                }
                else msg += 'data:' + obj.data + "\n";
            }
        }

        msg += "\n";

        return msg;
    } ,
    // SSE response headers
    SSEHeader = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive' ,
        'Access-Control-Allow-Origin': '*'
    } ,
    eventQueue = [] ,
    textQueue = [];

module.exports = app;

// Event-driven communication
app.get ('/event', function (req, res) {
    res.writeHead (200, SSEHeader);

    setInterval (function () {
        if (eventQueue.length > 0) {
            var evt = eventQueue.pop () ,
                msg = {
                    id: new Date().toLocaleTimeString () ,
                    event: 'foo' ,
                    data: {
                        date: evt.date ,
                        msg: evt.message
                    }
                };

            res.write (obj2SSE (msg));
            console.log ('EVENT');
            console.log (obj2SSE (msg));
        }
    }, 5000);
});

// Pure text communication
app.get ('/text', function (req, res) {
    res.writeHead (200, SSEHeader);

    setInterval (function () {
        if (textQueue.length > 0) {
            var msg = {
                id: new Date().toLocaleTimeString () ,
                data: textQueue.pop ()
            };

            res.write (obj2SSE (msg));
            console.log ('TEXT');
            console.log (obj2SSE (msg));
        }
    }, 1000);
});

setInterval (function () {
    var date = new Date().toLocaleTimeString ();
    eventQueue.push ({
        message: 'a message' ,
        date: date
    });
    textQueue.push ('[' + date + '] a message');
}, 3000);

console.log ('SSE server started on port: http://localhost:' + (process.env.PORT || 3000));
app.listen (process.env.PORT || 3000);
