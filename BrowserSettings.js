var home_page = "https://bloomandgrowasia.backpackit.com";
var select_new_tabs = false;

// Test for Gtk >= 2.16 (otherwise don't have a progress bar)

var have_progress_bar = false;

if(imports.gi.Gtk.Entry.prototype.set_progress_fraction)
{
	have_progress_bar = true;
}
