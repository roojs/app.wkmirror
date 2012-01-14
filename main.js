#!/usr/bin/env seed

Gtk = imports.gi.Gtk;
WebKit = imports.gi.WebKit;

Gtk.init(Seed.argv);

TabbedBrowser = imports.TabbedBrowser;
BrowserSettings = imports.BrowserSettings;

window = new Gtk.Window({title: "Browser"});
window.resize(800, 600);
window.signal.hide.connect(Gtk.main_quit);

var button = new Gtk.Button();
button.queue_draw_area(2,2,20,20);
button.set_label('Hello world');
//button.resize(20, 20);
button.signal.clicked.connect(Gtk.main_quit);

/* Add button to window */
//window.add(button);
TabbedBrowser.browser = new TabbedBrowser.TabbedBrowser();
window.add(TabbedBrowser.browser);
window.add()
window.show_all();

 
Gtk.main();
