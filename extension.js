import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'

export default class PowerColorExtension extends Extension {
  constructor(metadata) {
    super(metadata)
    this._proxy = null
    this._proxySignalId = null
    this._settingsSignalId = null
    this._timeoutId = null
  }

  enable() {
    this._settings = this.getSettings()
    this._proxy = null
    this._proxySignalId = null
    this._settingsSignalId = null
    this._timeoutId = null

    this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
      this._init()
      this._timeoutId = null
      return GLib.SOURCE_REMOVE
    })
  }

  _init() {
    try {
      this._proxy = new Gio.DBusProxy({
        g_bus_type: Gio.BusType.SYSTEM,
        g_name: 'net.hadess.PowerProfiles',
        g_object_path: '/net/hadess/PowerProfiles',
        g_interface_name: 'net.hadess.PowerProfiles',
      })

      this._proxy.init_async(GLib.PRIORITY_DEFAULT, null, (proxy, result) => {
        try {
          this._proxy.init_finish(result)
          this._proxySignalId = this._proxy.connect(
            'g-properties-changed',
            () => this._sync(),
          )
          this._settingsSignalId = this._settings.connect('changed', () =>
            this._sync(),
          )
          this._sync()
        } catch (e) {
          console.error(`[PowerColor] Init finish error: ${e.message}`)
        }
      })
    } catch (e) {
      console.error(`[PowerColor] Init Error: ${e.message}`)
    }
  }

  _getPowerActor() {
    const quickSettings = Main.panel.statusArea.quickSettings
    if (!quickSettings || !quickSettings._indicators) return null

    const children = quickSettings._indicators.get_children()

    return children.find((child) => {
      const isBattery = (actor) => {
        if (actor.icon_name && actor.icon_name.includes('battery')) return true
        return actor.get_children?.().some((c) => isBattery(c)) ?? false
      }
      return isBattery(child)
    })
  }

  _sync() {
    if (!this._proxy || !this._settings) return

    const profile =
      this._proxy.get_cached_property('ActiveProfile')?.unpack() || 'balanced'
    const powerActor = this._getPowerActor()

    if (!powerActor) return

    powerActor.set_style(null)

    if (profile === 'power-saver') {
      const color = this._settings.get_string('saver-color')
      powerActor.set_style(`color: ${color} !important;`)
    } else if (profile === 'performance') {
      const color = this._settings.get_string('performance-color')
      powerActor.set_style(`color: ${color} !important;`)
    }
  }

  disable() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId)
      this._timeoutId = null
    }

    if (this._proxy && this._proxySignalId) {
      this._proxy.disconnect(this._proxySignalId)
      this._proxySignalId = null
    }
    if (this._settings && this._settingsSignalId) {
      this._settings.disconnect(this._settingsSignalId)
      this._settingsSignalId = null
    }

    const powerActor = this._getPowerActor()
    if (powerActor) powerActor.set_style(null)

    this._proxy = null
    this._settings = null
  }
}
