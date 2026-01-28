'use strict'

import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import Gdk from 'gi://Gdk'
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export default class PowerColorPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings()
    const page = new Adw.PreferencesPage()
    const group = new Adw.PreferencesGroup({ title: 'Profile Colors' })

    const createColorRow = (title, key, defaultHex, enabledKey) => {
      const row = new Adw.ActionRow({ title })

      const rgba = new Gdk.RGBA()
      rgba.parse(settings.get_string(key) || defaultHex)
      const colorButton = new Gtk.ColorButton({
        rgba,
        valign: Gtk.Align.CENTER,
      })
      colorButton.connect('color-set', () => {
        const newColor = colorButton.get_rgba().to_string()
        settings.set_string(key, newColor)
      })

      const reset = new Gtk.Button({
        icon_name: 'view-refresh-symbolic',
        valign: Gtk.Align.CENTER,
        has_frame: false,
        tooltip_text: 'Reset to default',
      })
      reset.connect('clicked', () => {
        settings.set_string(key, defaultHex)
        const resetRgba = new Gdk.RGBA()
        resetRgba.parse(defaultHex)
        colorButton.set_rgba(resetRgba)
      })

      const toggle = new Gtk.Switch({
        active: settings.get_boolean(enabledKey),
        valign: Gtk.Align.CENTER,
      })
      settings.bind(enabledKey, toggle, 'active', Gio.SettingsBindFlags.DEFAULT)

      colorButton.set_sensitive(settings.get_boolean(enabledKey))
      settings.connect(`changed::${enabledKey}`, () => {
        colorButton.set_sensitive(settings.get_boolean(enabledKey))
      })

      const box = new Gtk.Box({ spacing: 12 })
      box.append(colorButton)
      box.append(reset)
      box.append(toggle)

      row.add_suffix(box)
      return row
    }

    group.add(
      createColorRow('Power Saver', 'saver-color', '#2DBA6E', 'saver-enabled'),
    )
    group.add(
      createColorRow(
        'Performance',
        'performance-color',
        '#3484E4',
        'performance-enabled',
      ),
    )
    group.add(
      createColorRow(
        'Balanced',
        'balanced-color',
        '#FFFFFF',
        'balanced-enabled',
      ),
    )

    page.add(group)
    window.add(page)
  }
}
