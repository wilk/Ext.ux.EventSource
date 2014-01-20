# Ext.ux.EventSource
==================

Wrapper for EventSource HTML5 object to manage SSE (Server Sent Event) with ExtJS and Sencha Touch.

## Install via Bower
First of all, install [**Bower**](http://bower.io/).

Then install `Ext.ux.EventSource`:

```bash
$ bower install ext.ux.eventsource
```

Now, you got the extension at the following path: *YOUR_PROJECT_PATH/bower_components/ext.ux.eventsource/*

It contains **EventSource.js** and a minified version **EventSource.min.js**.

Let's setup the **Ext.Loader** to require the right file:

```javascript
Ext.Loader.setConfig ({
	enabled: true ,
	paths: {
		'Ext.ux.EventSource': 'bower_components/ext.ux.eventsource/EventSource.js'
		// or the minified one: 'Ext.ux.EventSource': 'bower_components/ext.ux.eventsource/EventSource.min.js'
	}
});

Ext.require (['Ext.ux.EventSource']);
```


## Usage
Load `Ext.ux.EventSource` via `Ext.require`:

```javascript
Ext.Loader.setConfig ({
	enabled: true
});

Ext.require (['Ext.ux.EventSource']);
```

Now, you are ready to use them in your code as follows:

```javascript
// Creating a new instance of Ext.ux.EventSource
var es = Ext.create ('Ext.ux.EventSource', {
	url: 'your_url:your_port'
});

// Or

var es = Ext.create ('Ext.ux.EventSource', 'your_url:your_port');
```

## Communications supported
### Pure text communication
The communication is text-only, without objects or any other kind of data.

```javascript
var eventsource = Ext.create ('Ext.ux.EventSource', {
	url: 'http://localhost:3000/text' ,
	listeners: {
		open: function (es) {
			console.log ('The eventsource is ready to use');
		} ,
		close: function (es) {
			console.log ('The eventsource is closed!');
		} ,
		error: function (es, error) {
			Ext.Error.raise (error);
		} ,
		message: function (es, message) {
			console.log ('A new message is arrived: ' + message);
		}
	}
});
```

### Pure event-driven communication
The communication is event-driven: an event and a String or Object are sent and the eventsource object handles different events.

```javascript
var eventsource = Ext.create ('Ext.ux.EventSource', {
	url: 'http://localhost:3000/event' ,
	listeners: {
		open: function (es) {
			console.log ('The eventsource is ready to use');
		} ,
		close: function (es) {
			console.log ('The eventsource is closed!');
		}
	}
});

// A 'stop' event is sent from the server
// 'data' has 'cmd' and 'msg' fields
eventsource.on ('stop', function (es, data) {
	console.log ('Command: ' + data.cmd);
	console.log ('Message: ' + data.msg);
});
```

### Mixed communication
The communication is mixed: it can handles text-only and event-driven communication.

```javascript
var eventsource = Ext.create ('Ext.ux.EventSource', {
	url: 'http://localhost:3000/both' ,
	listeners: {
		open: function (es) {
			console.log ('The eventsource is ready to use');
		} ,
		close: function (es) {
			console.log ('The eventsource is closed!');
		} ,
		message: function (es, message) {
			console.log ('Text-only message arrived is: ' + message);
		}
	}
});

// A 'stop' event is sent from the server
// 'data' has 'cmd' and 'msg' fields
eventsource.on ('stop', function (data) {
	console.log ('Command: ' + data.cmd);
	console.log ('Message: ' + data.msg);
});
```

## Documentation
You can build the documentation (like ExtJS Docs) with [**jsduck**](https://github.com/senchalabs/jsduck):

```bash
$ jsduck ux --output /var/www/docs
```

It will make the documentation into docs dir and it will be visible at: http://localhost/docs

## License
The MIT License (MIT)

Copyright (c) 2013 Vincenzo Ferrari <wilk3ert@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
