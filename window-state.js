const {app, screen} = require('electron');

module.exports = {
  getNewWindowRect: function(options) {
    let rect;

    // If multiple windows are opened at once, state is only restored for first window. Consecutive windows get default
    // are created with default size and position.
    if (options.isFirstWindow) {

    } else {
      rect = {
        x: undefined,
        y: undefined,
        width: options.defaultWidth,
        height: options.defaultHeight
      };
    }

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

    return rect;
  },
  getNewWindowMaximized: function() {
    return true;
  },
  saveWindowState: function(rect, maximized) {

  }
};
