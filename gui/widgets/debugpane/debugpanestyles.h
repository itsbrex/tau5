#ifndef DEBUGPANE_STYLES_H
#define DEBUGPANE_STYLES_H

#include <QString>
#include <QWebEngineView>

class DebugPaneStyles
{
public:
    // CSS styles
    static QString getDarkScrollbarCSS();
    static QString getHeaderStyle();
    static QString getResizeHandleStyle();
    static QString getAutoScrollButtonStyle();
    
    // Theme application
    static void applyDevToolsDarkTheme(QWebEngineView *view);
    static void applyLiveDashboardTheme(QWebEngineView *view);
    static void applyConsoleDarkTheme(QWebEngineView *view);
    static void injectDevToolsFontScript(QWebEngineView *view);
    
    // Icon SVG creation
    static QString getRestartIconSvg(int frame = 0);
    static QString getAutoScrollIconSvg();
    static QString getBeamLogIconSvg();
    static QString getDevToolsIconSvg();
    static QString getSideBySideIconSvg();
    
private:
    static QString getDevToolsDarkThemeCSS();
    static QString getLiveDashboardThemeCSS();
    static QString getConsoleDarkThemeCSS();
    static QString getDevToolsFontScript();
};

#endif // DEBUGPANE_STYLES_H