import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';

export default class PowerColorPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({ title: 'Profile Colors' });

        const createColorRow = (title, key, defaultHex) => {
            const row = new Adw.ActionRow({ title });
            const colorButton = new Gtk.ColorDialogButton();
            const dialog = new Gtk.ColorDialog({ title: `Select ${title}` });
            colorButton.set_dialog(dialog);

            const update = () => {
                const rgba = new Gdk.RGBA();
                rgba.parse(settings.get_string(key) || defaultHex);
                colorButton.set_rgba(rgba);
            };

            update();
            colorButton.connect('notify::rgba', () => {
                settings.set_string(key, colorButton.get_rgba().to_string());
            });

            const reset = new Gtk.Button({ 
                icon_name: 'view-refresh-symbolic', 
                valign: Gtk.Align.CENTER, 
                has_frame: false 
            });
            reset.connect('clicked', () => { 
                settings.set_string(key, defaultHex); 
                update(); 
            });

            const box = new Gtk.Box({ spacing: 12 });
            box.append(colorButton);
            box.append(reset);
            row.add_suffix(box);
            return row;
        };

        group.add(createColorRow('Power Saver Color', 'saver-color', '#2DBA6E'));
        group.add(createColorRow('Performance Color', 'performance-color', '#3484E4'));
        page.add(group);
        window.add(page);
    }
}

