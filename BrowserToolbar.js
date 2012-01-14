Gtk = imports.gi.Gtk;

BrowserSettings = imports.BrowserSettings;
TabbedBrowser = imports.TabbedBrowser;
File = imports.File.File;



BrowserToolbar = new GType({
    parent: Gtk.HBox.type,
    name: "BrowserToolbar",
    init: function ()
    {
        // Private
        var url_bar = new Gtk.Entry();

        var back_button = new Gtk.ToolButton({stock_id:"gtk-go-back"});
        var forward_button = new Gtk.ToolButton({stock_id:"gtk-go-forward"});
        var refresh_button = new Gtk.ToolButton({stock_id:"gtk-refresh"});
        var grab_button = new Gtk.ToolButton({label:"mirror"});

        var back = function ()
        {
            TabbedBrowser.browser.current_tab().get_web_view().go_back();
        };

        var forward = function ()
        {
            TabbedBrowser.browser.current_tab().get_web_view().go_forward();
        };

        var refresh = function ()
        {
            
            
            TabbedBrowser.browser.current_tab().get_web_view().reload();
            
            /*TabbedBrowser.browser.current_tab().get_web_view().signals.onload_event(function() {
           
                print("Sending gather links");
                TabbedBrowser.browser.current_tab().get_web_view().execute_script(
                    "gatherlinks();"
                    
                );
             });
            */

        };

        var browse = function (url)
        {
            TabbedBrowser.browser.current_tab().get_web_view().browse(url.text);
        };

    	var grab = function(){
            print("sedning gather links (Start)");
            TabbedBrowser.browser.current_tab().get_web_view().add_inject();
            TabbedBrowser.browser.current_tab().get_web_view().execute_script(
                "BrowserMirror.gatherlinks();"
            );
    
           // print('test');
    	};
        
         
        // Public
        this.set_url = function (url)
        {
            url_bar.text = url;
        };

        this.set_can_go_back = function (can_go_back)
        {
            back_button.sensitive = can_go_back;
        };

        this.set_can_go_forward = function (can_go_forward)
        {
            forward_button.sensitive = can_go_forward;
        };

        this.set_progress = function (progress)
        {
            if(BrowserSettings.have_progress_bar)
                url_bar.set_progress_fraction(progress);
        };

        // Implementation
        back_button.signal.clicked.connect(back);
        forward_button.signal.clicked.connect(forward);
        refresh_button.signal.clicked.connect(refresh);
        url_bar.signal.activate.connect(browse);
        grab_button.signal.clicked.connect(grab);

        this.pack_start(back_button);
        this.pack_start(forward_button);
        
        
         this.pack_start(refresh_button);
         this.pack_start(grab_button);
        this.pack_start(url_bar, true, true);


    }
});
