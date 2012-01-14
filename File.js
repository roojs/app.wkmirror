// <script type ="text/Javascript">
GLib = imports.gi.GLib;
Gio = imports.gi.Gio;

String  = imports.String.String;

/**
* @class File
* @singleton
* 
* Library to wrap GLib and Gio basic File related methods
* 
* usage:
* 
* File = import.File.File;
* 
* var contents = File.read("/tmp/test.txt");
*
* 
* 
*/
var File = {
    
    /**
     * @static
     * @type {String} File seperator. (should be dynamic....)
     */
     
    
    SEPARATOR : '/',

 // fixme - this needs a bitter location.. 
    // they where in a string class before, but  overriding String methods is not a good normally a good idea..
      
    /**
     * Right trim (in here to reduce dependancies)
     * @param {String} s the string to trim
     * @param {String} string to trim off right..
     * @return {String} the trimmed string
     */
    rtrim : function (s,toTrim) {
        if (s.substr(s.length - toTrim.length) == toTrim) {
            return s.slice(0, s.length - toTrim.length);
        }
   
        return s;
    },
    /**
     * Trim a string (in here to reduce dependancies)
     * @param {String} s the string to trim
     * @param {String} string to trim off right..
     * @return {String} the trimmed string
     */
    trim : function (s,toTrim) {
        var out = this.ltrim(s,toTrim);
        out = this.rtrim(out,toTrim);
        return out;
    },
    /**
     * Left Trim a string (in here to reduce dependancies)
     * @param {String} s the string to trim
     * @param {String} string to trim off right..
     * @return {String} the trimmed string
     */
    ltrim : function (s, toTrim) {
        if (s.substr(0, toTrim.length) == toTrim) {
            return s.slice(toTrim.length);
        }
        
        return s;
    },
    /**
     * Get the base name of a path.
     * @param {String} path
     * @returns {String} basename
    */
    basename : function(path)
    {
        return path.split(File.SEPARATOR).pop();
    },
    
    /**
     * Get the directory name of a path. (could use Glib really)
     * @param {String} path
     * @returns {String} dirname
    */
    dirname : function(path)
    {
       var r = path.split(File.SEPARATOR)
       r.pop();
       return r.join(File.SEPARATOR);
    },
    
    
    /**
     * Join a path with the Correct File seperator (unix only at present...)
     * Takes a variable number of arguments, and joins them together.
     * @return {String} the joined path
     */
    join : function () {
        var out = "";
        for (var i = 0; i < arguments.length; i++) {
            if (i == 0) {
              out += this.rtrim(arguments[i], File.SEPARATOR);
            }
            else if (i == arguments.length - 1) {
              out += File.SEPARATOR + this.ltrim(arguments[i], File.SEPARATOR);
            }
            else {
              out += File.SEPARATOR + this.trim(arguments[i], File.SEPARATOR);
            }
        }
        return out;
    },
    /**
     * Read a file and return as string
     * @param {String} path The file location
     * @return {String} the joined path
     */
    read : function (path) {
        var out = {};
        GLib.file_get_contents(path, out, null, null);
        return out['value'];
    },
    /**
     * Check if a path points to a file.
     * @param {String} path The location
     * @return {Boolean} true if it's a file
     */
    isFile : function (path) {
      return GLib.file_test(path, GLib.FileTest.IS_REGULAR);
    },
    /**
     * Check if a path points to a file, directory or link..
     * @param {String} path The location
     * @return {Boolean} true if it exists
     */
    exists : function (path) {
      return GLib.file_test(path, GLib.FileTest.EXISTS);
    },
    /**
     * Check if a path points to a directory.
     * @param {String} path The location
     * @return {Boolean} true if it's a directory
     */
    isDirectory : function (path) {
      return GLib.file_test(path, GLib.FileTest.IS_DIR);
    },
    /**
     * list files in a directory.
     * @param {String} path The directory
     * @return {Array} list of files (with full path?)
     */
    list : function (path) {
        var listing = [];

        var f = Gio.file_new_for_path(String(path));
        var file_enum = f.enumerate_children(Gio.FILE_ATTRIBUTE_STANDARD_DISPLAY_NAME, Gio.FileQueryInfoFlags.NONE, null);

        var next_file = null;

        while ((next_file = file_enum.next_file(null)) != null) {
          listing.push(next_file.get_display_name());
        }

        file_enum.close(null);

        listing.sort();

        return listing;
    },
    /**
     * Get the last modification time of a file
     * @param {String} path The location
     * @return {Date} when the file was last modified
     */
    mtime : function (path) {
        var f = Gio.file_new_for_path(String(path));
        var mtime = new GLib.TimeVal();

        var info = f.query_info(Gio.FILE_ATTRIBUTE_TIME_MODIFIED, Gio.FileQueryInfoFlags.NONE, null);
        info.get_modification_time(mtime);

        return new Date(mtime.tv_sec * 1000);
    },
    /**
     * Resovle the absolute path of a file
     * @param {String} path The location (relative) to current working directory?
     * @return {String} the full path
     */
    canonical : function (path) {
        var f = Gio.file_new_for_path(String(path));
        var can = f.resolve_relative_path('');
        return can.get_path();
    },
    
    /**
     * write a string to file
     * @param {String} pathFile to write to
     * @param {String} string  Contents of file.
     * 
     */
    write : function (path, string) {
        var f = Gio.file_new_for_path(String(path));
        var data_out = new Gio.DataOutputStream({base_stream:f.replace(null, false, Gio.FileCreateFlags.NONE, null)});
        data_out.put_string(string, null);
        data_out.close(null);
    },
        /**
     * write a string to file
     * @param {String} pathFile to write to
     * @param {String} string  Contents of file.
     * 
     */
    writeBinaryArray : function (path, stringAr) {
        var f = Gio.file_new_for_path(String(path));
        var data_out = new Gio.DataOutputStream({base_stream:f.replace(null, false, Gio.FileCreateFlags.NONE, null)});
        for(var i =0; i < stringAr.length; i++) {
            data_out.put_byte(stringAr[i], null);
        }
        data_out.close(null);
    },
    /**
     * append a string to a file
     * @param {String} path  File to write to
     * @param {String}  string string to append to file.
     * 
     */
    append : function (path, string) {
        var f = Gio.file_new_for_path(String(path));
        var data_out = new Gio.DataOutputStream({
                base_stream:f.append_to(Gio.FileCreateFlags.NONE, null)
        });
        data_out.put_string(string, null);
        data_out.close(null);
    },
    /**
     * Delete a file.
     * @param  {String} path  File to remove    
     */
    remove : function (path)
    {
        var f = Gio.file_new_for_path(String(path));
        return f['delete']();
    },
    /**
     * copy files recursively from fromDir, silently ignore them if they already exist in toDir
     *        unless you select overwrite..
     * @param {String} src source path
     * @param {String} dest destination path
     * @param {Gio.FileCopyFlags} options (optional)  - use Gio.FileCopyFlags.OVERWRITE to 
     *      otherwise they will not be copied
     * 
     */
    silentRecursiveCopy : function (fromDir, toDir, opts) {
        
        var filesToCopy = File.recursiveListing(fromDir);
        var srcPath, destPath, src, dest;
        if (typeof(opts) =='undefined') {
            opts = Gio.FileCopyFlags.NONE;
        }
        
        for (var index in filesToCopy) {
            srcPath = File.join(String(fromDir), filesToCopy[index]);
            destPath = File.join(String(toDir), filesToCopy[index]);

            if (File.isDirectory(srcPath) && !File.isDirectory(destPath)) {
                File.mkdir(destPath);
                continue;
            }
            // source is not file..?!?!?
            if (!File.isFile(srcPath)) {
                continue;
            }
            if (File.isFile(destPath) && opts == Gio.FileCopyFlags.NONE) {
                // do not overwrite.. - if file exists and we are not flaged to overwrite.
                continue;
            }
            
            File.copyFile(srcPath, destPath, opts);
           
        }
    },
    
    /**
     * make a directory..
     * @param {String} dstPath directory to make
     */
    mkdir : function (destPath) {
        var dest = Gio.file_new_for_path(String(destPath));
        
        return dest.make_directory(null, null);
    },
    
    /**
     * make a directory..
     * @param {String} dstPath directory to make
     */
    mkdirall : function (destPath) {
        var parent = File.dirname(destPath);
        if (!File.exists(parent)) {
            File.mkdirall(parent);
        }
        if (!File.exists(destPath)) {
            return File.mkdir(destPath); 
        }
        return true;
    },
    
    /**
     * copy a File
     * @param {String} src source path
     * @param {String} dest destination path
     * @param {Gio.FileCopyFlags} options (optional)  - use Gio.FileCopyFlags.OVERWRITE to .. overwrite..
     * 
     */
    copyFile : function (srcPath, destPath, opts) {
        if (typeof(opts) =='undefined') {
            opts = Gio.FileCopyFlags.NONE;
        }
        var dest = Gio.file_new_for_path(String(destPath));
        var src = Gio.file_new_for_path(String(srcPath));

        // a bit of a hack for the fact that Gio.File.copy arguments
        // can be nulled, but not according to the GIR file
        return src.copy(dest, opts);
    },
    /**
     * recursively list files in a directory.
     * @param {String} path The directory
     * @return {Array} list of files (with full path?)
     */
    recursiveListing : function (dir) {

        function recursiveListingInternal(prefix, listing, dir) {
            var entries = File.list(dir);
            var next, fullPath;
  
            for (var index in entries) {
              next = entries[index];
              fullPath = File.join(prefix, dir, next);
  
              if (File.isDirectory(fullPath)) {
                listing.push(next);
                listing = listing.concat(recursiveListingInternal(next, [], fullPath));
              }
              else {
                if (prefix) {
                  next = File.join(prefix, next);
                }
                listing.push(next);
              }
            }
  
            return listing;
        }

        return recursiveListingInternal('', [], dir);
    }

};
