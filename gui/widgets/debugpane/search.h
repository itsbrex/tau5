#ifndef DEBUGPANE_SEARCH_H
#define DEBUGPANE_SEARCH_H

#include <QObject>
#include <QString>
#include <QTextEdit>
#include <QLineEdit>
#include <QPushButton>
#include <QWidget>
#include <QIcon>

class Search : public QObject
{
    Q_OBJECT

public:
    explicit Search(QObject *parent = nullptr);
    
    // Search widget creation
    static QWidget* createSearchWidget(QWidget *parent, QLineEdit *&searchInput, QPushButton *&closeButton);
    static QIcon createSearchIcon();
    static QIcon createCloseIcon();
    
    // Search functionality
    void setSearchTarget(QTextEdit *textEdit, QLineEdit *searchInput, QString *lastSearchText);
    void performSearch();
    void findNext();
    void findPrevious();
    void clearSearch();
    
    // Highlight functionality
    static void highlightAllMatches(QTextEdit *textEdit, const QString &searchText, const QTextCursor &currentMatch);

signals:
    void searchVisibilityChanged(bool visible);

private:
    QTextEdit *m_currentTextEdit;
    QLineEdit *m_currentSearchInput;
    QString *m_currentLastSearchText;
    
    static QString getSearchStyle();
};

#endif // DEBUGPANE_SEARCH_H