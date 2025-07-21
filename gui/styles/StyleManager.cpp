#include "StyleManager.h"

// Color Palette Definitions
const QString StyleManager::Colors::PRIMARY = "#ffa500";
const QString StyleManager::Colors::PRIMARY_RGB = "rgb(255, 165, 0)";
const QString StyleManager::Colors::SELECTION = "#4169e1";
const QString StyleManager::Colors::MUTED = "#888888";
const QString StyleManager::Colors::BACKGROUND = "#000000";
const QString StyleManager::Colors::FOREGROUND = "#ffffff";
const QString StyleManager::Colors::HIGHLIGHT = "rgb(255, 20, 147)";
const QString StyleManager::Colors::SURFACE = "#1e1e1e";
const QString StyleManager::Colors::TERMINAL_BACKGROUND = "#000000";

QString StyleManager::Colors::primaryAlpha(int alpha)
{
  return QString("rgba(255, 165, 0, %1)").arg(alpha);
}

QString StyleManager::Colors::backgroundAlpha(int alpha)
{
  return QString("rgba(0, 0, 0, %1)").arg(alpha);
}

QString StyleManager::Colors::foregroundAlpha(int alpha)
{
  return QString("rgba(255, 255, 255, %1)").arg(alpha);
}

QString StyleManager::Colors::selectionAlpha(int alpha)
{
  return QString("rgba(65, 105, 225, %1)").arg(alpha);
}

// Alpha conversion helpers - takes decimal 0.0-1.0
QString StyleManager::Colors::primaryAlpha(double alpha)
{
  return QString("rgba(255, 165, 0, %1)").arg(alpha);
}

QString StyleManager::Colors::backgroundAlpha(double alpha)
{
  return QString("rgba(0, 0, 0, %1)").arg(alpha);
}

QString StyleManager::Colors::selectionAlpha(double alpha)
{
  return QString("rgba(65, 105, 225, %1)").arg(alpha);
}

// Typography Definitions
const QString StyleManager::Typography::MONOSPACE_FONT_FAMILY = "'Consolas', 'Monaco', 'Courier New', monospace";
const QString StyleManager::Typography::DEFAULT_FONT_FAMILY = "system-ui, sans-serif";

const QString StyleManager::Typography::FONT_SIZE_SMALL = "10px";
const QString StyleManager::Typography::FONT_SIZE_MEDIUM = "12px";
const QString StyleManager::Typography::FONT_SIZE_LARGE = "14px";

const QString StyleManager::Typography::FONT_WEIGHT_NORMAL = "normal";
const QString StyleManager::Typography::FONT_WEIGHT_BOLD = "bold";

// Spacing Definitions
const QString StyleManager::Spacing::EXTRA_SMALL = "2px";
const QString StyleManager::Spacing::SMALL = "4px";
const QString StyleManager::Spacing::MEDIUM = "8px";
const QString StyleManager::Spacing::LARGE = "12px";
const QString StyleManager::Spacing::EXTRA_LARGE = "16px";

// Common Style Components
QString StyleManager::darkGradientBackground()
{
  return QString(
             "background: qlineargradient(x1:0, y1:0, x2:0, y2:1, "
             "  stop:0 %1, "
             "  stop:0.3 %2, "
             "  stop:0.7 %2, "
             "  stop:1 %3);")
      .arg(Colors::backgroundAlpha(191))
      .arg(Colors::backgroundAlpha(191))
      .arg(Colors::backgroundAlpha(191));
}

QString StyleManager::headerGradientBackground()
{
  return QString(
             "background: qlineargradient(x1:0, y1:0, x2:0, y2:1, "
             "  stop:0 rgba(26, 26, 26, 191), "
             "  stop:0.5 rgba(15, 15, 15, 191), "
             "  stop:1 %1);")
      .arg(Colors::backgroundAlpha(191));
}

QString StyleManager::primaryButton()
{
  return QString(
             "QPushButton { "
             "  background-color: %1; "
             "  color: %2; "
             "  border: 1px solid %2; "
             "  font-family: %3; "
             "  font-weight: %4; "
             "  padding: %5 %6; "
             "  border-radius: %7; "
             "}"
             "QPushButton:hover { "
             "  background-color: %8; "
             "}"
             "QPushButton:pressed { "
             "  background-color: %9; "
             "}")
      .arg(Colors::PRIMARY)
      .arg(Colors::BACKGROUND)
      .arg(Typography::MONOSPACE_FONT_FAMILY)
      .arg(Typography::FONT_WEIGHT_BOLD)
      .arg(Spacing::SMALL)
      .arg(Spacing::MEDIUM)
      .arg(Spacing::EXTRA_SMALL)
      .arg(Colors::primaryAlpha(220))
      .arg(Colors::primaryAlpha(180));
}

QString StyleManager::tau5Scrollbar()
{
  return QString(
             "QScrollBar:vertical { "
             "  background: transparent; "
             "  width: 8px; "
             "  border: none; "
             "  margin: 0px; "
             "}"
             "QScrollBar::handle:vertical { "
             "  background: %1; "
             "  border-radius: 0px; "
             "  min-height: 30px; "
             "  margin: 0px; "
             "  border: none; "
             "}"
             "QScrollBar::handle:vertical:hover { "
             "  background: %2; "
             "}"
             "QScrollBar::handle:vertical:pressed { "
             "  background: %2; "
             "}"
             "QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { "
             "  height: 0px; "
             "  background: transparent; "
             "  border: none; "
             "}"
             "QScrollBar::up-arrow:vertical, QScrollBar::down-arrow:vertical { "
             "  background: transparent; "
             "  border: none; "
             "}"
             "QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical { "
             "  background: transparent; "
             "  border: none; "
             "}")
      .arg(Colors::primaryAlpha(240))
      .arg(Colors::primaryAlpha(255));
}

QString StyleManager::primaryBorder(const QString &width)
{
  return QString("border: %1 solid %2;")
      .arg(width)
      .arg(Colors::primaryAlpha(150));
}

QString StyleManager::textEdit()
{
  return QString(
             "QTextEdit { "
             "  %1 "
             "  color: %2; "
             "  font-family: %3; "
             "  font-size: %4; "
             "  border: none; "
             "  padding: %5; "
             "  selection-background-color: %6; "
             "  selection-color: %7; "
             "}")
      .arg(darkGradientBackground())
      .arg(Colors::PRIMARY)
      .arg(Typography::MONOSPACE_FONT_FAMILY)
      .arg(Typography::FONT_SIZE_MEDIUM)
      .arg(Spacing::LARGE)
      .arg(Colors::HIGHLIGHT)
      .arg(Colors::BACKGROUND);
}

QString StyleManager::checkbox()
{
  return QString(
             "QCheckBox { "
             "  background: transparent; "
             "  color: %1; "
             "  font-family: %2; "
             "  font-size: %3; "
             "  font-weight: %4; "
             "  spacing: %5; "
             "}"
             "QCheckBox::indicator { "
             "  width: 16px; "
             "  height: 16px; "
             "  border-radius: 3px; "
             "  background: %6; "
             "  border: 2px solid %7; "
             "}"
             "QCheckBox::indicator:checked { "
             "  background: %8; "
             "  border: 2px solid %9; "
             "}"
             "QCheckBox::indicator:hover { "
             "  border: 2px solid %10; "
             "}")
      .arg(Colors::PRIMARY)
      .arg(Typography::MONOSPACE_FONT_FAMILY)
      .arg(Typography::FONT_SIZE_SMALL)
      .arg(Typography::FONT_WEIGHT_BOLD)
      .arg(Spacing::SMALL)
      .arg(Colors::backgroundAlpha(150))
      .arg(Colors::primaryAlpha(150))
      .arg(Colors::primaryAlpha(200))
      .arg(Colors::primaryAlpha(255))
      .arg(Colors::primaryAlpha(255));
}

// Component-specific styles
QString StyleManager::consoleHeader()
{
  return QString(
             "QWidget { "
             "  %1 "
             "  padding-top: 6px; "
             "}")
      .arg(headerGradientBackground());
}

QString StyleManager::consoleOutput()
{
  return textEdit() + tau5Scrollbar();
}

QString StyleManager::guiButton()
{
  return primaryButton();
}

QString StyleManager::mainWindow()
{
  return QString("background-color: %1;").arg(Colors::BACKGROUND);
}