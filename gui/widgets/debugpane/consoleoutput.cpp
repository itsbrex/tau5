#include "consoleoutput.h"
#include "../../styles/StyleManager.h"
#include <QScrollBar>
#include <QTextBlock>
#include <QTextCursor>
#include <QFont>
#include <QFontDatabase>

ConsoleOutput::ConsoleOutput(QTextEdit *textEdit, QObject *parent)
    : QObject(parent)
    , m_textEdit(textEdit)
    , m_autoScroll(true)
    , m_maxLines(DEFAULT_MAX_LINES)
    , m_fontSize(DEFAULT_FONT_SIZE)
{
    applyFont(m_textEdit, m_fontSize);
}

void ConsoleOutput::appendText(const QString &text, bool isError)
{
    if (!m_textEdit)
        return;
        
    QTextCursor cursor(m_textEdit->document());
    cursor.movePosition(QTextCursor::End);
    
    QTextCharFormat format;
    format.setForeground(isError ? QColor(StyleManager::Colors::SELECTION) : QColor(StyleManager::Colors::FOREGROUND));
    
    cursor.insertText(text, format);
    
    trimExcessLines();
    
    if (m_autoScroll) {
        QScrollBar *vScrollBar = m_textEdit->verticalScrollBar();
        vScrollBar->setValue(vScrollBar->maximum());
    }
}

void ConsoleOutput::setAutoScroll(bool enabled)
{
    if (m_autoScroll != enabled) {
        m_autoScroll = enabled;
        emit autoScrollChanged(enabled);
        
        if (enabled && m_textEdit) {
            QScrollBar *vScrollBar = m_textEdit->verticalScrollBar();
            vScrollBar->setValue(vScrollBar->maximum());
        }
    }
}

void ConsoleOutput::clear()
{
    if (m_textEdit) {
        m_textEdit->clear();
    }
}

void ConsoleOutput::setFontSize(int size)
{
    m_fontSize = qBound(MIN_FONT_SIZE, size, MAX_FONT_SIZE);
    applyFont(m_textEdit, m_fontSize);
    emit fontSizeChanged(m_fontSize);
}

void ConsoleOutput::zoomIn()
{
    setFontSize(m_fontSize + 1);
}

void ConsoleOutput::zoomOut()
{
    setFontSize(m_fontSize - 1);
}

void ConsoleOutput::trimExcessLines()
{
    if (!m_textEdit)
        return;
        
    QTextDocument *doc = m_textEdit->document();
    int lineCount = doc->blockCount();
    
    if (lineCount > m_maxLines) {
        QTextCursor cursor(doc);
        cursor.movePosition(QTextCursor::Start);
        
        // Calculate how many lines to remove
        int linesToRemove = lineCount - m_maxLines;
        
        // Move to the end of the lines to remove
        for (int i = 0; i < linesToRemove; ++i) {
            cursor.movePosition(QTextCursor::EndOfBlock);
            if (i < linesToRemove - 1) {
                cursor.movePosition(QTextCursor::NextBlock);
            }
        }
        
        // Select from start to current position
        cursor.movePosition(QTextCursor::NextCharacter);
        cursor.movePosition(QTextCursor::Start, QTextCursor::KeepAnchor);
        
        // Remove the selected text
        cursor.removeSelectedText();
    }
}

void ConsoleOutput::applyFont(QTextEdit *textEdit, int fontSize)
{
    if (!textEdit)
        return;
        
    QFont font;
    
    // Try to use Cascadia Code first
    if (QFontDatabase::families().contains("Cascadia Code PL")) {
        font.setFamily("Cascadia Code PL");
    } else if (QFontDatabase::families().contains("Cascadia Code")) {
        font.setFamily("Cascadia Code");
    } else {
        // Fallback to system monospace font
        font.setFamily(QFontDatabase::systemFont(QFontDatabase::FixedFont).family());
    }
    
    font.setPointSize(fontSize);
    font.setStyleHint(QFont::Monospace);
    font.setFixedPitch(true);
    
    textEdit->setFont(font);
}

QString ConsoleOutput::getConsoleStyle()
{
    return QString(
        "QTextEdit {"
        "  background-color: %1;"
        "  color: %2;"
        "  border: none;"
        "  selection-background-color: %3;"
        "  selection-color: %4;"
        "}"
    ).arg(StyleManager::Colors::BACKGROUND)
     .arg(StyleManager::Colors::FOREGROUND)
     .arg(StyleManager::Colors::primaryAlpha(128))
     .arg(StyleManager::Colors::FOREGROUND);
}