#include "debugpanestyles.h"
#include "../../styles/StyleManager.h"
#include <QWebEngineScript>
#include <QWebEnginePage>

QString DebugPaneStyles::getDarkScrollbarCSS()
{
    return QString(R"(
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ::-webkit-scrollbar-track {
            background: %1;
        }
        ::-webkit-scrollbar-thumb {
            background: %2;
            border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: %3;
        }
    )").arg(StyleManager::Colors::blackAlpha(77))
       .arg(StyleManager::Colors::primaryOrangeAlpha(128))
       .arg(StyleManager::Colors::primaryOrangeAlpha(179));
}

QString DebugPaneStyles::getHeaderStyle()
{
    return QString(
        "QWidget#headerWidget {"
        "  background-color: %1;"
        "  border-bottom: 1px solid %2;"
        "}"
    ).arg(StyleManager::Colors::DARK_BACKGROUND)
     .arg(StyleManager::Colors::primaryOrangeAlpha(100));
}

QString DebugPaneStyles::getResizeHandleStyle()
{
    return QString(
        "background-color: transparent;"
        "border-top: %1px solid %2;"
    ).arg(4)  // RESIZE_HANDLE_VISUAL_HEIGHT
     .arg(StyleManager::Colors::primaryOrangeAlpha(100));
}

QString DebugPaneStyles::getAutoScrollButtonStyle()
{
    return QString(
        "QPushButton {"
        "  background-color: transparent;"
        "  border: none;"
        "  padding: 4px;"
        "  color: %1;"
        "}"
        "QPushButton:hover {"
        "  background-color: %2;"
        "  border-radius: 3px;"
        "}"
        "QPushButton:checked {"
        "  background-color: %3;"
        "  color: %4;"
        "}"
    ).arg(StyleManager::Colors::TIMESTAMP_GRAY)
     .arg(StyleManager::Colors::blackAlpha(51))
     .arg(StyleManager::Colors::PRIMARY_ORANGE)
     .arg(StyleManager::Colors::WHITE);
}

void DebugPaneStyles::applyDevToolsDarkTheme(QWebEngineView *view)
{
    if (!view) return;
    
    QString css = getDevToolsDarkThemeCSS();
    QString script = QString(R"(
        (function() {
            var style = document.createElement('style');
            style.textContent = `%1`;
            document.head.appendChild(style);
        })();
    )").arg(css);
    
    view->page()->runJavaScript(script);
}

void DebugPaneStyles::applyLiveDashboardTheme(QWebEngineView *view)
{
    if (!view) return;
    
    QString css = getLiveDashboardThemeCSS();
    QString script = QString(R"(
        (function() {
            var style = document.createElement('style');
            style.textContent = `%1`;
            document.head.appendChild(style);
        })();
    )").arg(css);
    
    view->page()->runJavaScript(script);
}

void DebugPaneStyles::applyConsoleDarkTheme(QWebEngineView *view)
{
    if (!view) return;
    
    QString css = getConsoleDarkThemeCSS();
    QString script = QString(R"(
        (function() {
            var style = document.createElement('style');
            style.textContent = `%1`;
            document.head.appendChild(style);
        })();
    )").arg(css);
    
    view->page()->runJavaScript(script);
}

void DebugPaneStyles::injectDevToolsFontScript(QWebEngineView *view)
{
    if (!view) return;
    
    QString script = getDevToolsFontScript();
    view->page()->runJavaScript(script);
}

QString DebugPaneStyles::getDevToolsDarkThemeCSS()
{
    // Minimal subset - the actual implementation would be much larger
    return QString(R"(
        :root {
            --sys-color-base: var(--ref-palette-neutral99);
            --sys-color-on-surface: #CDD3DE;
        }
        body {
            background-color: #202124 !important;
            color: #e8eaed !important;
        }
    )");
}

QString DebugPaneStyles::getLiveDashboardThemeCSS()
{
    return QString(R"(
        body {
            background-color: %1 !important;
            color: %2 !important;
        }
        %3
    )").arg(StyleManager::Colors::BLACK)
       .arg(StyleManager::Colors::WHITE)
       .arg(getDarkScrollbarCSS());
}

QString DebugPaneStyles::getConsoleDarkThemeCSS()
{
    return QString(R"(
        body {
            background-color: %1 !important;
            color: %2 !important;
            font-family: 'Cascadia Code PL', 'Cascadia Code', monospace !important;
        }
        %3
    )").arg(StyleManager::Colors::BLACK)
       .arg(StyleManager::Colors::WHITE)
       .arg(getDarkScrollbarCSS());
}

QString DebugPaneStyles::getDevToolsFontScript()
{
    return QString(R"(
        (function() {
            const waitForRoot = setInterval(() => {
                const root = document.querySelector('.root-view');
                if (root) {
                    clearInterval(waitForRoot);
                    root.style.fontSize = '12px';
                }
            }, 100);
        })();
    )");
}

QString DebugPaneStyles::getRestartIconSvg(int frame)
{
    Q_UNUSED(frame);  // In actual implementation, would use frame for animation
    return R"(<svg width="16" height="16" viewBox="0 0 16 16" fill="#999">
        <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
        <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
    </svg>)";
}

QString DebugPaneStyles::getAutoScrollIconSvg()
{
    return R"(<svg width="16" height="16" viewBox="0 0 16 16" fill="#999">
        <path d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
    </svg>)";
}

QString DebugPaneStyles::getBeamLogIconSvg()
{
    return R"(<svg width="16" height="16" viewBox="0 0 16 16" fill="#999">
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
        <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
    </svg>)";
}

QString DebugPaneStyles::getDevToolsIconSvg()
{
    return R"(<svg width="16" height="16" viewBox="0 0 16 16" fill="#999">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>)";
}

QString DebugPaneStyles::getSideBySideIconSvg()
{
    return R"(<svg width="16" height="16" viewBox="0 0 16 16" fill="#999">
        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
    </svg>)";
}