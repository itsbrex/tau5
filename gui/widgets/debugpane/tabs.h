#ifndef DEBUGPANE_TABS_H
#define DEBUGPANE_TABS_H

#include <QObject>
#include <QList>
#include <QPushButton>
#include <QStackedWidget>

class Tabs : public QObject
{
    Q_OBJECT

public:
    explicit Tabs(QObject *parent = nullptr);
    
    void addTab(QPushButton *button, QWidget *widget);
    void switchTab(int index);
    void setCurrentTab(int index);
    int currentIndex() const;
    
    void setStackedWidget(QStackedWidget *stack);
    QList<QPushButton*> tabButtons() const { return m_tabButtons; }
    
    static QString getTabButtonStyle();
    static QPushButton* createTabButton(const QString &text, QWidget *parent);

signals:
    void tabChanged(int index);

private:
    void updateTabStyles(int activeIndex);
    
private:
    QStackedWidget *m_stackedWidget;
    QList<QPushButton*> m_tabButtons;
    QList<QWidget*> m_tabWidgets;
    int m_currentIndex;
};

#endif // DEBUGPANE_TABS_H