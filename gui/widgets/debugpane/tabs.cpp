#include "tabs.h"
#include "../../styles/StyleManager.h"

Tabs::Tabs(QObject *parent)
    : QObject(parent)
    , m_stackedWidget(nullptr)
    , m_currentIndex(0)
{
}

void Tabs::addTab(QPushButton *button, QWidget *widget)
{
    m_tabButtons.append(button);
    m_tabWidgets.append(widget);
    
    if (m_stackedWidget) {
        m_stackedWidget->addWidget(widget);
    }
    
    // Connect button click to switch tab
    int index = m_tabButtons.size() - 1;
    connect(button, &QPushButton::clicked, [this, index]() {
        switchTab(index);
    });
}

void Tabs::setStackedWidget(QStackedWidget *stack)
{
    m_stackedWidget = stack;
    
    // Add all existing widgets to the stack
    for (QWidget *widget : m_tabWidgets) {
        m_stackedWidget->addWidget(widget);
    }
}

void Tabs::switchTab(int index)
{
    if (index < 0 || index >= m_tabButtons.size())
        return;
        
    m_currentIndex = index;
    
    if (m_stackedWidget) {
        m_stackedWidget->setCurrentIndex(index);
    }
    
    updateTabStyles(index);
    emit tabChanged(index);
}

void Tabs::setCurrentTab(int index)
{
    switchTab(index);
}

int Tabs::currentIndex() const
{
    return m_currentIndex;
}

void Tabs::updateTabStyles(int activeIndex)
{
    QString activeStyle = QString(
        "QPushButton {"
        "  background-color: %1;"
        "  color: %2;"
        "  border: none;"
        "  font-weight: 600;"
        "  font-size: 12px;"
        "  padding: 10px;"
        "  text-align: center;"
        "}"
        "QPushButton:hover {"
        "  background-color: %3;"
        "}"
    ).arg(StyleManager::Colors::PRIMARY)
     .arg(StyleManager::Colors::FOREGROUND)
     .arg(StyleManager::Colors::primaryAlpha(230));

    QString inactiveStyle = QString(
        "QPushButton {"
        "  background-color: transparent;"
        "  color: %1;"
        "  border: none;"
        "  font-weight: 600;"
        "  font-size: 12px;"
        "  padding: 10px;"
        "  text-align: center;"
        "}"
        "QPushButton:hover {"
        "  background-color: %2;"
        "  color: %3;"
        "}"
    ).arg(StyleManager::Colors::MUTED)
     .arg(StyleManager::Colors::backgroundAlpha(51))
     .arg(StyleManager::Colors::FOREGROUND);

    for (int i = 0; i < m_tabButtons.size(); ++i) {
        if (i == activeIndex) {
            m_tabButtons[i]->setStyleSheet(activeStyle);
        } else {
            m_tabButtons[i]->setStyleSheet(inactiveStyle);
        }
    }
}

QString Tabs::getTabButtonStyle()
{
    return QString(
        "QPushButton {"
        "  background-color: transparent;"
        "  color: %1;"
        "  border: none;"
        "  font-weight: 600;"
        "  font-size: 12px;"
        "  padding: 10px;"
        "  text-align: center;"
        "}"
        "QPushButton:hover {"
        "  background-color: %2;"
        "  color: %3;"
        "}"
    ).arg(StyleManager::Colors::MUTED)
     .arg(StyleManager::Colors::backgroundAlpha(51))
     .arg(StyleManager::Colors::FOREGROUND);
}

QPushButton* Tabs::createTabButton(const QString &text, QWidget *parent)
{
    QPushButton *button = new QPushButton(text, parent);
    button->setStyleSheet(getTabButtonStyle());
    button->setCursor(Qt::PointingHandCursor);
    return button;
}