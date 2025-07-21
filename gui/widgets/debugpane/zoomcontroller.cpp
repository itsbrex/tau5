#include "zoomcontroller.h"
#include "consoleoutput.h"
#include "../../styles/StyleManager.h"
#include <QPixmap>
#include <QPainter>

ZoomController::ZoomController(QObject *parent)
    : QObject(parent)
{
}

void ZoomController::zoomWebView(QWebEngineView *view, bool zoomIn)
{
    if (!view)
        return;
        
    qreal currentZoom = view->zoomFactor();
    qreal newZoom = zoomIn ? currentZoom + WEB_ZOOM_STEP : currentZoom - WEB_ZOOM_STEP;
    newZoom = qBound(MIN_WEB_ZOOM, newZoom, MAX_WEB_ZOOM);
    
    view->setZoomFactor(newZoom);
}

void ZoomController::zoomTextEdit(QTextEdit *textEdit, int &currentFontSize, bool zoomIn)
{
    if (!textEdit)
        return;
        
    int newSize = zoomIn ? currentFontSize + 1 : currentFontSize - 1;
    newSize = qBound(MIN_FONT_SIZE, newSize, MAX_FONT_SIZE);
    
    if (newSize != currentFontSize) {
        currentFontSize = newSize;
        ConsoleOutput::applyFont(textEdit, currentFontSize);
    }
}

QPushButton* ZoomController::createZoomButton(const QIcon &icon, const QString &tooltip, QWidget *parent)
{
    QPushButton *button = new QPushButton(parent);
    button->setIcon(icon);
    button->setToolTip(tooltip);
    button->setFixedSize(24, 24);
    button->setStyleSheet(getZoomButtonStyle());
    button->setCursor(Qt::PointingHandCursor);
    return button;
}

QString ZoomController::getZoomButtonStyle()
{
    return QString(
        "QPushButton {"
        "  background-color: transparent;"
        "  border: none;"
        "  padding: 4px;"
        "}"
        "QPushButton:hover {"
        "  background-color: %1;"
        "  border-radius: 3px;"
        "}"
    ).arg(StyleManager::Colors::blackAlpha(51));
}

QIcon ZoomController::createZoomInIcon()
{
    QPixmap pixmap(16, 16);
    pixmap.fill(Qt::transparent);
    
    QPainter painter(&pixmap);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.setPen(QPen(QColor(StyleManager::Colors::TIMESTAMP_GRAY), 2));
    
    // Draw plus sign
    painter.drawLine(8, 4, 8, 12);
    painter.drawLine(4, 8, 12, 8);
    
    return QIcon(pixmap);
}

QIcon ZoomController::createZoomOutIcon()
{
    QPixmap pixmap(16, 16);
    pixmap.fill(Qt::transparent);
    
    QPainter painter(&pixmap);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.setPen(QPen(QColor(StyleManager::Colors::TIMESTAMP_GRAY), 2));
    
    // Draw minus sign
    painter.drawLine(4, 8, 12, 8);
    
    return QIcon(pixmap);
}