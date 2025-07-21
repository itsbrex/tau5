#include "search.h"
#include "../../styles/StyleManager.h"
#include <QHBoxLayout>
#include <QTextCursor>
#include <QTextDocument>
#include <QTextCharFormat>
#include <QPixmap>
#include <QPainter>

Search::Search(QObject *parent)
    : QObject(parent)
    , m_currentTextEdit(nullptr)
    , m_currentSearchInput(nullptr)
    , m_currentLastSearchText(nullptr)
{
}

void Search::setSearchTarget(QTextEdit *textEdit, QLineEdit *searchInput, QString *lastSearchText)
{
    m_currentTextEdit = textEdit;
    m_currentSearchInput = searchInput;
    m_currentLastSearchText = lastSearchText;
}

QWidget* Search::createSearchWidget(QWidget *parent, QLineEdit *&searchInput, QPushButton *&closeButton)
{
    QWidget *searchWidget = new QWidget(parent);
    searchWidget->setObjectName("searchWidget");
    searchWidget->setStyleSheet(QString(
        "#searchWidget {"
        "  background-color: %1;"
        "  border-top: 1px solid %2;"
        "}"
    ).arg(StyleManager::Colors::BLACK)
     .arg(StyleManager::Colors::primaryOrangeAlpha(100)));
    
    QHBoxLayout *searchLayout = new QHBoxLayout(searchWidget);
    searchLayout->setContentsMargins(10, 5, 10, 5);
    searchLayout->setSpacing(10);
    
    searchInput = new QLineEdit(searchWidget);
    searchInput->setPlaceholderText("Search...");
    searchInput->setStyleSheet(getSearchStyle());
    
    closeButton = new QPushButton(searchWidget);
    closeButton->setIcon(createCloseIcon());
    closeButton->setFixedSize(20, 20);
    closeButton->setStyleSheet(
        "QPushButton {"
        "  background-color: transparent;"
        "  border: none;"
        "}"
        "QPushButton:hover {"
        "  background-color: rgba(255, 255, 255, 0.1);"
        "}"
    );
    closeButton->setCursor(Qt::PointingHandCursor);
    
    searchLayout->addWidget(searchInput);
    searchLayout->addWidget(closeButton);
    
    searchWidget->hide();
    
    return searchWidget;
}

QIcon Search::createSearchIcon()
{
    QString searchSvg = R"(
        <svg width="16" height="16" viewBox="0 0 16 16" fill="%1">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
    )";
    
    QPixmap pixmap(16, 16);
    pixmap.fill(Qt::transparent);
    QPainter painter(&pixmap);
    painter.setRenderHint(QPainter::Antialiasing);
    
    // Create the icon (simplified approach - in real implementation would parse SVG)
    QIcon icon;
    icon.addPixmap(pixmap);
    return icon;
}

QIcon Search::createCloseIcon()
{
    QPixmap pixmap(16, 16);
    pixmap.fill(Qt::transparent);
    
    QPainter painter(&pixmap);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.setPen(QPen(QColor(StyleManager::Colors::TIMESTAMP_GRAY), 2));
    painter.drawLine(4, 4, 12, 12);
    painter.drawLine(4, 12, 12, 4);
    
    return QIcon(pixmap);
}

QString Search::getSearchStyle()
{
    return QString(
        "QLineEdit {"
        "  background-color: %1;"
        "  color: %2;"
        "  border: 1px solid %3;"
        "  border-radius: 3px;"
        "  padding: 5px;"
        "  font-size: 12px;"
        "}"
        "QLineEdit:focus {"
        "  border-color: %4;"
        "}"
    ).arg(StyleManager::Colors::blackAlpha(128))
     .arg(StyleManager::Colors::WHITE)
     .arg(StyleManager::Colors::primaryOrangeAlpha(77))
     .arg(StyleManager::Colors::PRIMARY_ORANGE);
}

void Search::performSearch()
{
    if (!m_currentTextEdit || !m_currentSearchInput || !m_currentLastSearchText)
        return;
        
    QString searchText = m_currentSearchInput->text();
    if (searchText.isEmpty())
        return;
    
    // Clear previous highlights if search text changed
    if (searchText != *m_currentLastSearchText) {
        QTextCursor clearCursor(m_currentTextEdit->document());
        clearCursor.select(QTextCursor::Document);
        QTextCharFormat clearFormat;
        clearFormat.setBackground(Qt::transparent);
        clearCursor.mergeCharFormat(clearFormat);
        *m_currentLastSearchText = searchText;
    }
    
    // Find first occurrence
    QTextDocument *doc = m_currentTextEdit->document();
    QTextCursor cursor = doc->find(searchText, 0);
    
    if (!cursor.isNull()) {
        m_currentTextEdit->setTextCursor(cursor);
        m_currentTextEdit->ensureCursorVisible();
        
        // Highlight all matches
        highlightAllMatches(m_currentTextEdit, searchText, cursor);
    }
}

void Search::findNext()
{
    if (!m_currentTextEdit || !m_currentSearchInput)
        return;
        
    QString searchText = m_currentSearchInput->text();
    if (searchText.isEmpty())
        return;
    
    QTextCursor cursor = m_currentTextEdit->textCursor();
    cursor = m_currentTextEdit->document()->find(searchText, cursor);
    
    if (cursor.isNull()) {
        // Wrap around to beginning
        cursor = m_currentTextEdit->document()->find(searchText, 0);
    }
    
    if (!cursor.isNull()) {
        m_currentTextEdit->setTextCursor(cursor);
        m_currentTextEdit->ensureCursorVisible();
        highlightAllMatches(m_currentTextEdit, searchText, cursor);
    }
}

void Search::findPrevious()
{
    if (!m_currentTextEdit || !m_currentSearchInput)
        return;
        
    QString searchText = m_currentSearchInput->text();
    if (searchText.isEmpty())
        return;
    
    QTextCursor cursor = m_currentTextEdit->textCursor();
    cursor = m_currentTextEdit->document()->find(searchText, cursor, QTextDocument::FindBackward);
    
    if (cursor.isNull()) {
        // Wrap around to end
        cursor = m_currentTextEdit->document()->find(searchText, m_currentTextEdit->document()->characterCount() - 1, QTextDocument::FindBackward);
    }
    
    if (!cursor.isNull()) {
        m_currentTextEdit->setTextCursor(cursor);
        m_currentTextEdit->ensureCursorVisible();
        highlightAllMatches(m_currentTextEdit, searchText, cursor);
    }
}

void Search::clearSearch()
{
    if (!m_currentTextEdit)
        return;
        
    QTextCursor clearCursor(m_currentTextEdit->document());
    clearCursor.select(QTextCursor::Document);
    QTextCharFormat clearFormat;
    clearFormat.setBackground(Qt::transparent);
    clearCursor.mergeCharFormat(clearFormat);
    
    if (m_currentLastSearchText) {
        m_currentLastSearchText->clear();
    }
}

void Search::highlightAllMatches(QTextEdit *textEdit, const QString &searchText, const QTextCursor &currentMatch)
{
    QTextDocument *doc = textEdit->document();
    QTextCursor highlightCursor(doc);
    QTextCharFormat highlightFormat;
    QTextCharFormat currentFormat;
    
    // Different colors for matches and current match
    highlightFormat.setBackground(QColor(StyleManager::Colors::primaryOrangeAlpha(51)));
    currentFormat.setBackground(QColor(StyleManager::Colors::PRIMARY_ORANGE));
    currentFormat.setForeground(QColor(StyleManager::Colors::WHITE));
    
    // First, highlight all matches
    while (!highlightCursor.isNull() && !highlightCursor.atEnd()) {
        highlightCursor = doc->find(searchText, highlightCursor);
        if (!highlightCursor.isNull()) {
            highlightCursor.mergeCharFormat(highlightFormat);
        }
    }
    
    // Then highlight the current match differently
    if (!currentMatch.isNull()) {
        QTextCursor current = currentMatch;
        current.mergeCharFormat(currentFormat);
    }
}