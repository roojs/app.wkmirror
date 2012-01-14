//file which parses document body

// is prototype insane?
try {
    delete Array.prototype.toJSON;
    delete Object.prototype.toJSON;

    delete Hash.prototype.toJSON;
    delete String.prototype.toJSON;
} catch (e) {
    
}

BrowserMirror = {
    gatherlinks : function () { 
        var urls= [];
        for (var i= document.links.length; i-->0;){
            urls.push( {
                href: document.links[i].href,
                label : document.links[i].textContent
            });
            
        }
        console.log(JSON.stringify( {
            requesturl : document.location.href, // buggy - we should return the requested path.
            method: 'gatherlinks' ,
            data : urls
        }));
          
        //return urls;
        
    },
    downloadhead : function (url) {
        var xmlhttp = new XMLHttpRequest();
                    
        
        xmlhttp.open("HEAD", url,true);
        xmlhttp.onreadystatechange=function() {
            if (xmlhttp.readyState==4) {
                console.log(
                    JSON.stringify ({
                        requesturl : url,
                        method: 'downloadhead',
                        headers : xmlhttp.getAllResponseHeaders(),
                        contentType:xmlhttp.getResponseHeader("Content-Type"),
                        data:''
                    }));
            }
        }
        
        xmlhttp.send(null);
           
    },

    downloadpage : function (url) {
        
       
        var xmlhttp = new XMLHttpRequest();
                    
        xmlhttp.open("GET", url,true);
        xmlhttp.responseType = 'arraybuffer';

        xmlhttp.onload=function() {
           
            var ar= [];
             
            var r = new Uint8Array(xmlhttp.response);
            for (i=0;i<r.byteLength;i++) {
                ar.push(r[i]);
            }
            
            console.log(
                JSON.stringify ({
                    requesturl : url,
                    method: 'downloadpage',
                    headers : xmlhttp.getAllResponseHeaders(),
                    contentType:xmlhttp.getResponseHeader("Content-Type"),
                    data: ar
                }));
           
        }
        
        xmlhttp.send(null);
           
    }
    
}

        



//downloadpage();
//gatherlinks();
