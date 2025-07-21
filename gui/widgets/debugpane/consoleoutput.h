#ifndef DEBUGPANE_CONSOLEOUTPUT_H
#define DEBUGPANE_CONSOLEOUTPUT_H

#include <QObject>
#include <QTextEdit>
#include <QString>

class ConsoleOutput : public QObject
{
    Q_OBJECT

public:
    explicit ConsoleOutput(QTextEdit *textEdit, QObject *parent = nullptr);
    
    void appendText(const QString &text, bool isError = false);
    void setAutoScroll(bool enabled);
    bool autoScroll() const { return m_autoScroll; }
    
    void setMaxLines(int maxLines) { m_maxLines = maxLines; }
    int maxLines() const { return m_maxLines; }
    
    void clear();
    
    // Font management
    void setFontSize(int size);
    int fontSize() const { return m_fontSize; }
    void zoomIn();
    void zoomOut();
    
    // Static utility methods
    static void applyFont(QTextEdit *textEdit, int fontSize);
    static QString getConsoleStyle();

signals:
    void autoScrollChanged(bool enabled);
    void fontSizeChanged(int size);

private:
    void trimExcessLines();
    
private:
    QTextEdit *m_textEdit;
    bool m_autoScroll;
    int m_maxLines;
    int m_fontSize;
    
    static constexpr int MIN_FONT_SIZE = 8;
    static constexpr int MAX_FONT_SIZE = 24;
    static constexpr int DEFAULT_FONT_SIZE = 11;
    static constexpr int DEFAULT_MAX_LINES = 10000;
};

#endif // DEBUGPANE_CONSOLEOUTPUT_H