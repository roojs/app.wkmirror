Gtk = imports.gi.Gtk;
WebKit = imports.gi.WebKit;

TabbedBrowser = imports.TabbedBrowser;
File = imports.File.File;


BrowserView = new GType({
    parent: WebKit.WebView.type,
    name: "BrowserView",
    init: function ()
    {
        // Private
        
        
        var _t = this;
        
        var tab;
        var browsePage = false;
        var maxQueue = 0;
        var injected = {};
        
        var storedir = '/tmp/wkqueue';
        if (!File.exists(storedir)) {
            File.mkdir(storedir);
        }
        var parsedir = storedir + '/parse_queue';
        var downloaddir = storedir + '/download_queue';
        var donedir = storedir + '/downloaded_queue';
        if (!File.exists(parsedir)) {
            File.mkdir(parsedir);
        }
        if (!File.exists(downloaddir)) {
            File.mkdir(downloaddir);
        }
        if (!File.exists(donedir)) {
            File.mkdir(donedir);
        }
	
        var update_title = function (web_view, web_frame, title)
        {
            if(title.length > 25)
                title = title.slice(0,25) + "...";

            tab.get_tab_label().label = title;
        };

        var update_url = function (web_view, web_frame)
        {
            var toolbar = tab.get_toolbar();

            toolbar.set_url(web_frame.get_uri());
            toolbar.set_can_go_back(web_view.can_go_back());
            toolbar.set_can_go_forward(web_view.can_go_forward());
        };

        var update_progress = function (bar, progress)
        {
            tab.get_toolbar().set_progress(progress / 100);
        };

        var create_new_tab = function (web_view, web_frame, new_web_view)
        {
            new_web_view = new BrowserView();
            new_web_view.signal.web_view_ready.connect(show_new_tab);
            return new_web_view;
        };

        var show_new_tab = function (new_web_view)
        {
            TabbedBrowser.browser.new_tab("", new_web_view);

            return false;
        };

        var hover_link = function (web_view, link, url)
        {
            tab.get_statusbar().set_status(url);
        };

        
        
        
        this.add_inject = function(force)
        {
            
            if (force || (typeof(injected[this.uri]) == 'undefined' )) {
                injected[this.uri] = 0;
            }
            if (injected[this.uri] > 2) {
                return;
            }
            injected[this.uri]++;
            var fn = __script_path__ + "/inject.js";
            if (File.exists(fn)) {
                print("Adding inject");
                var newjs = File.read(__script_path__ + "/inject.js");
                TabbedBrowser.browser.current_tab().get_web_view().execute_script(
                    newjs
                    
                );
            }
            
        }
        var load_finished = function ()
        {
            print("load finished");
            tab.get_toolbar().set_progress(0);
            
            
            _t.add_inject(true);
            
            if (browsePage) {
                print("onload: calling gather links");
                 TabbedBrowser.browser.current_tab().get_web_view().execute_script(
                    'BrowserMirror.gatherlinks();'
                    
                );
                
            }
            
            
        };

        var load_committed = function (web_view, web_frame)
        {
            update_url(web_view, web_frame);
        };

        var clicked_link = function (web_view, web_frame, request,
                                     action, decision, window)
        {
            if(action.get_reason() == WebKit.WebNavigationReason.LINK_CLICKED &&
               action.get_button() == 2)
            {
                browser.new_tab(request.get_uri(), null);
                return true;
            }

            return false;
        };

        // Public
        
        
        this.browse = function (url)
        {
            if(url.search("://") < 0)
                url = "http://" + url;

            this.open(url);
        };

        this.set_tab = function (new_tab)
        {
            tab = new_tab;
        };

        this.get_tab = function ()
        {
            return tab;
        };


        this.downloadqueue = function()
        {
            var filesList = File.list(downloaddir);
            print("DOWNLOAD QUEUE LENGTH: " + filesList.length);
            if (!maxQueue || maxQueue < filesList.length) {
                maxQueue  = filesList.length;
            }
            
            tab.get_toolbar().set_progress(filesList.length / Math.max(maxQueue, filesList.length ));
            if (filesList == null || filesList.length == 0  ){
                
                return false;
            }  
            var url = decodeURIComponent(filesList[0]);
            if (!this.checkdomain(url)) {
                print("SKIP (external domain) : " + url);
                File.remove(downloaddir + '/' + filesList[0]);
                return this.downloadqueue();
                
            }
            this.downloadhead( url);
            return true;
            
        };
	
    
        this.queuerun = function()
        {
            if (this.downloadqueue()) return true;
            return this.parsequeue();
        };
        
        this.parsequeue = function(){
            var filesList = File.list(parsedir);
            if (filesList == null || filesList.length == 0  ){
                return false;
            } 
            
            browsePage = decodeURIComponent(filesList[0]);
            print("parsing page:" + browsePage );
            this.browse(browsePage);
            
             
            
            
            
            return true;
        };
	
        
        this.downloadpage = function(link){
            print("calling download page: " + link);
            _t.add_inject(); // just in case..
                //var url = File.read(__script_path__+"/downloadqueue/"+link);
            this.execute_script(
                "BrowserMirror.downloadpage(" + JSON.stringify(link) +");"
            );		
		
            
        };
 
        this.downloadhead = function(link){
            print("calling download head: " + link);
            _t.add_inject(); // just in case..
                //var url = File.read(__script_path__+"/downloadqueue/"+link);
            this.execute_script(
                "BrowserMirror.downloadhead(" + JSON.stringify(link) +");"
            );		
		 
        };
	

        // Implementation
        //this.set_scroll_adjustments(null, null);

        this.signal.title_changed.connect(update_title);
        this.signal.load_committed.connect(load_committed);
        this.signal.load_finished.connect(load_finished);
        this.signal.load_progress_changed.connect(update_progress);

        // For some reason, this segfaults seed in the instance init closure handler
        // Once that's fixed, uncommenting the next line will give middle-click-open-in-new tab
        //this.signal.navigation_policy_decision_requested.connect(clicked_link);

        this.signal.hovering_over_link.connect(hover_link);

        this.signal.create_web_view.connect(create_new_tab);
        
         
        print("ADDing console message sig handler");
        
        
        
        
        this.signal.console_message.connect(function(wv, msg, line, sid) {
            // print('BrowserView.js got ' + msg);
            var methodname;
            var ret;
            try {
                ret = JSON.parse(msg);
            
            } catch(e) {
                print("GOT INVALID message:" + msg)
                return true;
                
                
            }
            print("got method : " + ret.method);
            
            if (ret.method == 'gatherlinks'){
                // flag the page as parsed.
                
                if (browsePage) {
                    _t.moveToDone(browsePage);
                    
                }
                var sourcePage = browsePage;
                browsePage = false;
                print(typeof(ret.data));
                if (typeof(ret.data) != 'object' ) {
                    print("GOT INVALID DATA?:" + JSON.stringify(ret,null,4));
                    ret.data= [];
                    
                }
                ret.data.forEach(function(ln) {
                    if (!ln.href.match(/^http[s]*:\/\//)) {
                        print("SKIP link: " + ln.href);
                        return;
                    }
                    ln.href= ln.href.replace(/#.*$/,'');
                    
                    if (!_t.checkdomain(ln.href) ) {
                        print("SKIP link (external domain): " + ln.href);
                        return;
                    }
                    
                    // this is just for our purposes..
                    
                    if (ln.href.match(/\/pages\/[0-9]+$/)) {
                        print("SKIP link (ingore unnamed pages): " + ln.href);
                        return;
                    }
                    
                    
                    
                    var fn = encodeURIComponent(ln.href);
                    
                    var dupe  = _t.dupeCheck(ln.href);
                    if (dupe) {
                        
                        if (dupe == downloaddir + '/'  + fn) {
                            var info = JSON.parse(File.read(dupe));
                            if (info && info.fromUrl && info.fromUrl.length > sourcePage.length) {
                                print("SKIP link (in queue already): " + ln.href);
                                return;
                            }
                            print("found a longer link for url")
                        } else {
                            print("SKIP link (in another queue): " + ln.href);
                            return;
                        }
                    }
                     
                    File.write(downloaddir + '/'  + fn, JSON.stringify( {
                        label : ln.label,
                        fromURL : sourcePage
                    })); // write an empyt file indicating it needs downloading..
                });         
                var filesList = File.list(downloaddir);
            
                maxQueue =  filesList.length;
            }
            
            if (ret.method == 'downloadpage'){
                // got the results from download page:
                // requesturl 
                // remove from downloadqueue.
             
                
                //
                try { 
                    var mt = ret.contentType.split(';').shift();
                } catch( e) {
                    print("INVALID CONTENT TYPE? \n" + JSON.stringify(ret));
                    mt='';
                }
                
                switch(mt) {
                   
                    case '':
                        _t.moveToDone(ret.requesturl);
                        break;
                    
                    default:
                        var info = false;
                        var info_f = _t.dupeCheck(ret.requesturl);
                        if (info_f) {
                            info  = JSON.parse(File.read(info_f));
                        }
                    
                        _t.moveToDone(ret.requesturl);
                        // flag it as done..
                       
                        // write it...
                        var target  = _t.toFilename(ret.requesturl);
                        if (info && info.fromURL) {
                            var bn = decodeURIComponent(File.basename(target));
                            target = _t.toFilename(info.fromURL+'/'+ bn);
                        }
                        
                        
                        
                        
                        //File.write(target ,decodeURIComponent(escape(base64.decode( ret.data))));
                        print("GOT array sized: " + ret.data.length);
                        
                        File.writeBinaryArray(target,ret.data);
                        print("Wrote to file: " + target);
                        break;
                }
                
                // if it's HTML then add it to parse queue
                // otehrwise save it.. and run the queue again.
               
                
                //File.write(storedir+"/parsequeue/"+Math.random(), msg);
            }
            
           
            if (ret.method == 'downloadhead'){
                // got the results from download page:
                // requesturl 
                // remove from downloadqueue.
                
                //
                try { 
                    var mt = ret.contentType.split(';').shift();
                } catch( e) {
                    print("INVALID CONTENT TYPE? \n" + JSON.stringify(ret));
                    mt='';
                }
                
                switch(mt) {
                    case 'text/html':
                        // add to parse QUEUE..
                        print("moving to parse queue");
                        _t.moveToParse(ret.requesturl);
                        break;
                    // stuf we do not care about..
                    case 'application/atom+xml':
                    case '':
                        print("moving to done queue");
                         _t.moveToDone(ret.requesturl);
                        break;
                    
                    default:
                        print("calling download file");
                        _t.downloadpage( ret.requesturl );
                        // keep it on the queue..
                        // do not run the queue..
                        return true;
                     
                }
                
                // if it's HTML then add it to parse queue
                // otehrwise save it.. and run the queue again.
               
                
                //File.write(storedir+"/parsequeue/"+Math.random(), msg);
            }
            _t.queuerun();
            
            return true;
        });
        
        
        this.toFilename = function(url)
        {
            url = url.replace(/^http[s]*:\/\//, '');
            var p = url.split('/');
            p.unshift(storedir+'/output');
            for (var i =1 ;i < p.length; i++) {
                p[i] = encodeURIComponent(p[i]);
            }
            ret = p.join('/');
            var dir = File.dirname(ret);
            File.mkdirall(dir);
            return ret;
            
        }
        this.checkdomain = function(comp)
        {
            var b = parseUri(this.uri);
            var d = parseUri(comp);
            return (d.host == b.host && d.protocol == b.protocol);
            
            
        }
        
        this.dupeCheck = function(url)
        {
            
           // order - return highest up the queue first..
            if (File.exists(downloaddir +'/' + encodeURIComponent(url))) {
                return downloaddir +'/' + encodeURIComponent(url);
            }
             if (File.exists(parsedir +'/' + encodeURIComponent(url))) {
                return parsedir +'/' + encodeURIComponent(url);
            }
            if (File.exists(donedir +'/' + encodeURIComponent(url))) {
                return donedir +'/' + encodeURIComponent(url);
            }
            return  false;
            
            
        }
        this.moveToParse = function(url)
        {
            var old = this.dupeCheck(url);
            var target =parsedir +'/' + encodeURIComponent(url);
            if (old == target) {
                return;
            }
            File.write(target, old ? File.read(old) : '');
            if (old) {
                File.remove(old);
            }
            
        }
        
        this.moveToDownload= function(url)
        {
            var old = this.dupeCheck(url);
            var target =downloaddir +'/' + encodeURIComponent(url);
            if (old == target) {
                return;
            }
            File.write(target, old ? File.read(old) : '');
            if (old) {
                File.remove(old);
            }
            
        }
        this.moveToDone= function(url)
        {
            var old = this.dupeCheck(url);
            var target = donedir +'/' + encodeURIComponent(url);
            if (old == target) {
                return;
            }
            File.write(target, old ? File.read(old) : '');
            if (old) {
                File.remove(old);
            }
            
        }
        
    }
});

function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};
