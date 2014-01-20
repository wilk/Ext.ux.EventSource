Ext.Loader.setConfig ({
    enabled: true,
    paths: {
        'Ext.ux.EventSource': '../EventSource.js'
    }
});

Ext.require (['Ext.ux.EventSource']);

Ext.define ('DEMO.view.OpenConnection', {
    extend: 'Ext.panel.Panel' ,

    title: 'Open a new connection' ,
    width: 300 ,
    layout: 'anchor' ,

    openConnection: function (obj) {
        var url = obj.up('panel').down('textfield').getValue ();

        var es = Ext.create ('Ext.ux.EventSource', {
            url: url ,
            listeners: {
                open: function (es) {
                    if (Ext.get (es.url)) Ext.get(es.url).dom.innerHTML += '> EventSource just open!<br/>';
                } ,
                message: function (es, data) {
                    Ext.get(es.url).dom.innerHTML += '> ' + data + '<br/>';
                } ,
                close: function (es) {
                    var panel = Ext.getCmp ('panel' + es.url);

                    if ((panel !== null) || (typeof panel !== 'undefined')) {
                        panel.destroy ();
                    }
                }
            }
        });

        // Connection panel
        var panel = Ext.create ('Ext.panel.Panel', {
            title: url ,
            es: es ,
            id: 'panel' + url ,

            layout: 'anchor' ,

            bodyPadding: 5 ,
            collapsible: true ,

            items: [{
                xtype: 'container' ,
                html: 'Incoming from the server:<br/><div id="' + url + '" style="height: 60px; border: black solid 1px; padding: 5px; margin: 5px 0 5px 0; overflow: auto"></div>'
            } , {
                xtype: 'textarea' ,
                labelAlign: 'top' ,
                fieldLabel: 'Send a message' ,
                anchor: '100%'
            }] ,

            buttons: [{
                text: 'Reset' ,
                handler: function (btn) {
                    btn.up('panel').down('textarea').reset ();
                }
            } , {
                text: 'Send' ,
                handler: function (btn) {
                    btn.up('panel').es.send(btn.up('panel').down('textarea').getValue ());
                }
            }] ,

            dockedItems: {
                xtype: 'toolbar' ,
                dock: 'top' ,
                defaults: {
                    xtype: 'button'
                } ,
                /*items: [{
                    // Registers to Ext.ux.WebSocketManager
                    text: 'Register' ,
                    handler: function (btn, evt) {
                        if (btn.getText () === 'Register') {
                            Ext.ux.WebSocketManager.register (btn.up('toolbar').up('panel').es);
                            btn.setText ('Unregister');
                        }
                        else {
                            Ext.ux.WebSocketManager.unregister (btn.up('toolbar').up('panel').es);
                            btn.setText ('Register');
                        }
                    }
                } , {
                    text: 'Close' ,
                    handler: function (btn, evt) {
                        btn.up('toolbar').up('panel').es.close ();
                        btn.up('toolbar').up('panel').destroy ();
                    }
                }]*/
            }
        });

        Ext.getCmp('connections').add (panel);
    } ,

    items: [{
        xtype: 'textfield' ,
        anchor: '100%' ,
        fieldLabel: 'URL' ,
        labelAlign: 'top' ,
        listeners: {
            specialKey: function (tf, evt) {
                if (evt.getKey () === evt.ENTER) {
                    this.up('panel').openConnection (tf);
                }
            }
        }
    }] ,

    buttons: [{
        text: 'Reset' ,
        handler: function (btn) {
            btn.up('panel').down('textfield').reset ();
        }
    } , {
        text: 'Open' ,
        handler: function (btn) {
            btn.up('panel').openConnection (btn);
        }
    }]
});

Ext.define ('DEMO.view.BroadcastConnection', {
    extend: 'Ext.panel.Panel' ,

    title: 'Broadcast Connection' ,
    width: 500 ,
    layout: 'fit' ,

    items: [{
        xtype: 'textarea' ,
        fieldLabel: 'Broadcast a message' ,
        labelAlign: 'top' ,
    }] ,

    buttons: [{
        text: 'Close any connections' ,
        handler: function () {
            //Ext.ux.WebSocketManager.closeAll ();
        }
    } , '->' , {
        text: 'Reset' ,
        handler: function (btn) {
            btn.up('panel').down('textarea').reset ();
        }
    } , {
        // Broadcasts a message
        text: 'Send' ,
        handler: function () {
            //Ext.ux.WebSocketManager.broadcast ('BROADCAST: ' + btn.up('panel').down('textarea').getValue ());
        }
    }]
});

Ext.onReady (function () {
    var esText = null ,
        esEvent = null;

    Ext.create ('Ext.container.Container', {
        renderTo: Ext.getBody () ,

        layout: {
            type: 'hbox' ,
            align: 'middle' ,
            pack: 'center'
        } ,

        items: [{
            xtype: 'container' ,
            layout: {
                type: 'vbox' ,
                align: 'stretch'
            } ,
            width: 800 ,

            items: [{
                xtype: 'panel',

                title: 'Demo Ext.ux.EventSource' ,
                titleAlign: 'center' ,

                layout: {
                    type: 'vbox' ,
                    align: 'stretch'
                } ,

                items: [{
                    xtype: 'panel' ,
                    title: 'Pure text notifications' ,
                    layout: {
                        type: 'vbox' ,
                        align: 'stretch'
                    } ,
                    items: [{
                        xtype: 'container' ,
                        html: '<div id="logText" style="height: 260px; border: black solid 1px; padding: 5px; overflow: auto"></div>'
                    }] ,
                    bbar: {
                        type: 'toolbar' ,
                        items: [{
                            text: 'Connect' ,
                            name: 'connect' ,
                            listeners: {
                                click: function (btn) {
                                    var logText = Ext.get ('logText');

                                    logText.dom.innerHTML += "Opening text notifications channel...<br />";
                                    btn.hide ();
                                    btn.up('toolbar').down('button[name=close]').show ();

                                    esText = Ext.create ('Ext.ux.EventSource', {
                                        url: 'http://localhost:3000/text' ,
                                        listeners: {
                                            open: function (es) {
                                                logText.dom.innerHTML += "Text notifications channel opened!<br />";
                                            } ,
                                            close: function (es) {
                                                logText.dom.innerHTML += "Text notifications channel closed!<br />";
                                            } ,
                                            error: function (es, error) {
                                                Ext.Error.raise (error);
                                            } ,
                                            message: function (es, message) {
                                                logText.dom.innerHTML += message + "<br />";
                                            }
                                        }
                                    });
                                }
                            }
                        } , {
                            text: 'Close' ,
                            name: 'close' ,
                            hidden: true ,
                            listeners: {
                                click: function (btn) {
                                    esText.close ();
                                    btn.hide ();
                                    btn.up('toolbar').down('button[name=connect]').show ();
                                }
                            }
                        }]
                    }
                } , {
                    xtype: 'panel' ,
                    title: 'Event notifications' ,
                    layout: {
                        type: 'vbox' ,
                        align: 'stretch'
                    } ,
                    items: [{
                        xtype: 'container' ,
                        html: '<div id="logEvent" style="height: 260px; border: black solid 1px; padding: 5px; overflow: auto"></div>'
                    }] ,
                    bbar: {
                        type: 'toolbar' ,
                        items: [{
                            text: 'Connect' ,
                            name: 'connect' ,
                            listeners: {
                                click: function (btn) {
                                    var logEvent = Ext.get ('logEvent');

                                    logEvent.dom.innerHTML += "Opening event notifications channel...<br />";
                                    btn.hide ();
                                    btn.up('toolbar').down('button[name=close]').show ();

                                    esEvent = Ext.create ('Ext.ux.EventSource', {
                                        url: 'http://localhost:3000/event' ,
                                        listeners: {
                                            open: function (es) {
                                                logEvent.dom.innerHTML += "Event notifications channel opened!<br />";
                                            } ,
                                            close: function (es) {
                                                logEvent.dom.innerHTML += "Event notifications channel closed!<br />";
                                            } ,
                                            error: function (es, error) {
                                                Ext.Error.raise (error);
                                            }
                                        }
                                    });

                                    esEvent.on ('foo', function (es, message) {
                                        logEvent.dom.innerHTML += 'event: foo' + ' - {date:' + message.date + ', msg:' + message.msg + "}<br />";
                                    });
                                }
                            }
                        } , {
                            text: 'Close' ,
                            name: 'close' ,
                            hidden: true ,
                            listeners: {
                                click: function (btn) {
                                    esEvent.close ();
                                    btn.hide ();
                                    btn.up('toolbar').down('button[name=connect]').show ();
                                }
                            }
                        }]
                    }
                }]
            }]
        }]
    });
});
