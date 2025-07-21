#ifndef DEBUGPANE_ZOOMCONTROLLER_H
#define DEBUGPANE_ZOOMCONTROLLER_H

#include <QObject>
#include <QIcon>
#include <QPushButton>
#include <QWebEngineView>
#include <QTextEdit>

class ZoomController : public QObject
{
    Q_OBJECT

public:
    explicit ZoomController(QObject *parent = nullptr);
    
    // Zoom operations
    static void zoomWebView(QWebEngineView *view, bool zoomIn);
    static void zoomTextEdit(QTextEdit *textEdit, int &currentFontSize, bool zoomIn);
    
    // UI creation
    static QPushButton* createZoomButton(const QIcon &icon, const QString &tooltip, QWidget *parent);
    static QString getZoomButtonStyle();
    
    // Icon creation
    static QIcon createZoomInIcon();
    static QIcon createZoomOutIcon();
    
private:
    static constexpr qreal WEB_ZOOM_STEP = 0.1;
    static constexpr qreal MIN_WEB_ZOOM = 0.25;
    static constexpr qreal MAX_WEB_ZOOM = 5.0;
    static constexpr int MIN_FONT_SIZE = 8;
    static constexpr int MAX_FONT_SIZE = 24;
};

#endif // DEBUGPANE_ZOOMCONTROLLER_H