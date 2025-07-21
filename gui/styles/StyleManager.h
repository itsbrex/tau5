#ifndef STYLEMANAGER_H
#define STYLEMANAGER_H

#include <QString>
#include <QColor>

class StyleManager
{
public:
  // Color Palette
  struct Colors
  {
    // Primary theme colors
    static const QString PRIMARY;            // Main brand/accent color (currently orange)
    static const QString PRIMARY_RGB;        // RGB format of primary color
    static const QString SELECTION;          // Selection and interactive states (currently blue)
    static const QString MUTED;              // Secondary/muted text (currently gray)
    static const QString BACKGROUND;         // Main background (currently black)
    static const QString FOREGROUND;         // Main text color (currently white)
    static const QString HIGHLIGHT;          // Text selection highlight (currently pink)
    static const QString SURFACE;            // Elevated surface background (currently dark)
    static const QString TERMINAL_BACKGROUND; // Terminal/console specific background

    // Alpha variants for transparency
    static QString primaryAlpha(int alpha);
    static QString backgroundAlpha(int alpha);
    static QString foregroundAlpha(int alpha);
    static QString selectionAlpha(int alpha);
    
    // Alpha conversion helpers (0.0-1.0)
    static QString primaryAlpha(double alpha);
    static QString backgroundAlpha(double alpha);
    static QString selectionAlpha(double alpha);
  };

  // Typography
  struct Typography
  {
    static const QString MONOSPACE_FONT_FAMILY;
    static const QString DEFAULT_FONT_FAMILY;

    static const QString FONT_SIZE_SMALL;  // 10px
    static const QString FONT_SIZE_MEDIUM; // 12px
    static const QString FONT_SIZE_LARGE;  // 14px

    static const QString FONT_WEIGHT_NORMAL;
    static const QString FONT_WEIGHT_BOLD;
  };

  // Spacing
  struct Spacing
  {
    static const QString EXTRA_SMALL; // 2px
    static const QString SMALL;       // 4px
    static const QString MEDIUM;      // 8px
    static const QString LARGE;       // 12px
    static const QString EXTRA_LARGE; // 16px
  };

  // Common Style Components
  static QString darkGradientBackground();
  static QString headerGradientBackground();
  static QString primaryButton();
  static QString secondaryButton();
  static QString tau5Scrollbar();
  static QString primaryBorder(const QString &width = "1px");
  static QString textEdit();
  static QString checkbox();

  // Component-specific styles
  static QString consoleHeader();
  static QString consoleOutput();
  static QString consoleScrollbar();
  static QString guiButton();
  static QString mainWindow();

private:
  StyleManager() = default; // Static class, no instantiation
};

#endif // STYLEMANAGER_H