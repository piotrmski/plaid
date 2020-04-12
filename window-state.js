const {app, screen} = require('electron');
const fs = require('fs');
const path = require('path');

module.exports = {
  getNewWindowRect: function(options) {
    // Getting window state is far from critical, hence the whole function body can be wrapped in a 'try' block.
    try {
      let rect;

      // If multiple windows are opened at once, state is only restored for first window. Consecutive windows get default
      // are created with default size and position.
      if (options.isFirstWindow) {
        rect = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'window-state.json'), 'utf8')).rect;
      } else {
        rect = {
          x: undefined,
          y: undefined,
          width: options.defaultWidth,
          height: options.defaultHeight
        };
      }

      // If position of the window is defined, validate it against available displays.
      if (rect.x != null && rect.y != null) {
        const correspondingScreen = screen.getDisplayMatching(rect).bounds;

        // Validate size. If if exceeds the screen size, shrink it down.
        if (rect.width > correspondingScreen.width) {
          rect.width = correspondingScreen.width;
        }
        if (rect.height > correspondingScreen.height) {
          rect.height = correspondingScreen.height;
        }

        // Validate position. If it lays beyond screen bounds, push it to fit inside the screen bounds.
        if (rect.x < correspondingScreen.x) {
          rect.x = correspondingScreen.x;
        } else if (rect.x + rect.width > correspondingScreen.x + correspondingScreen.width) {
          rect.x = correspondingScreen.x + correspondingScreen.width - rect.width;
        }
        if (rect.y < correspondingScreen.y) {
          rect.y = correspondingScreen.y;
        } else if (rect.y + rect.height > correspondingScreen.y + correspondingScreen.height) {
          rect.y = correspondingScreen.y + correspondingScreen.height - rect.height;
        }
      }

      return rect;
    } catch {
      return {
        x: undefined,
        y: undefined,
        width: options.defaultWidth,
        height: options.defaultHeight
      };
    }
  },

  getNewWindowMaximized: function(isFirstWindow) {
    // If multiple windows are opened at once, state is only restored for first window. Consecutive windows get default
    // are created with default size and position.
    if (isFirstWindow) {
      try {
        return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'window-state.json'), 'utf8')).maximized;
      } catch {
        return false;
      }
    } else {
      return false;
    }
  },

  saveWindowState: function(rect, maximized) {
    // Saving window state is far from critical, if it fails, it does not matter.
    try {
      fs.writeFileSync(path.join(app.getPath('userData'), 'window-state.json'), JSON.stringify({
        rect,
        maximized
      }), 'utf8');
    } catch {}
  }
};
