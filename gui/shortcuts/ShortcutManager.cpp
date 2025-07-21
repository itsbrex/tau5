#include "ShortcutManager.h"
#include <QShortcut>
#include <QAction>
#include <QWidget>

ShortcutManager& ShortcutManager::instance()
{
    static ShortcutManager instance;
    return instance;
}

ShortcutManager::ShortcutManager()
{
    initializeDefaultShortcuts();
}

void ShortcutManager::initializeDefaultShortcuts()
{
    // Use explicit key combinations to prevent Qt's automatic platform translation
    // These will use Ctrl on ALL platforms unless explicitly overridden
    
    // Global shortcuts
    registerShortcut(ToggleDebugPane, QKeySequence(Qt::CTRL | Qt::Key_D), 
                    "Toggle Debug Pane", Global);
    registerShortcut(ToggleFullScreen, QKeySequence(Qt::Key_F11), 
                    "Toggle Full Screen", Global);
    
    // Debug pane shortcuts
    registerShortcut(DebugPaneSearch, QKeySequence(Qt::CTRL | Qt::Key_S), 
                    "Search in Debug Pane", DebugPane);
    registerShortcut(DebugPaneFindNext, QKeySequence(Qt::CTRL | Qt::Key_S), 
                    "Find Next Match", DebugPane);
    registerShortcut(DebugPaneFindPrevious, QKeySequence(Qt::CTRL | Qt::Key_R), 
                    "Find Previous Match", DebugPane);
    registerShortcut(DebugPaneCloseSearch, QKeySequence(Qt::CTRL | Qt::Key_G), 
                    "Close Search", DebugPane);
    
    // View shortcuts
    registerShortcut(ZoomIn, QKeySequence(Qt::CTRL | Qt::Key_Plus), 
                    "Zoom In", View);
    registerShortcut(ZoomOut, QKeySequence(Qt::CTRL | Qt::Key_Minus), 
                    "Zoom Out", View);
    registerShortcut(ZoomReset, QKeySequence(Qt::CTRL | Qt::Key_0), 
                    "Reset Zoom", View);
    
    // Navigation shortcuts
    registerShortcut(ResetBrowser, QKeySequence(Qt::CTRL | Qt::SHIFT | Qt::Key_R), 
                    "Reset Browser", Navigation);
    registerShortcut(OpenExternalBrowser, QKeySequence(Qt::CTRL | Qt::SHIFT | Qt::Key_E), 
                    "Open in External Browser", Navigation);
    
    // Help shortcuts
    registerShortcut(ShowHelp, QKeySequence(Qt::Key_F1), 
                    "Show Help", Help);
    registerShortcut(ShowAbout, QKeySequence(), 
                    "About Tau5", Help);
}

void ShortcutManager::registerShortcut(ShortcutId id, const QKeySequence& keySequence, 
                                      const QString& description, ShortcutCategory category)
{
    m_shortcuts[id] = {keySequence, description, category};
}

QShortcut* ShortcutManager::createShortcut(ShortcutId id, QWidget* parent, 
                                          std::function<void()> callback,
                                          Qt::ShortcutContext context)
{
    if (!m_shortcuts.contains(id) || !parent) {
        return nullptr;
    }
    
    const auto& info = m_shortcuts[id];
    if (info.keySequence.isEmpty()) {
        return nullptr;
    }
    
    QShortcut* shortcut = new QShortcut(info.keySequence, parent);
    shortcut->setContext(context);
    if (callback) {
        QObject::connect(shortcut, &QShortcut::activated, parent, callback);
    }
    
    return shortcut;
}

QAction* ShortcutManager::createAction(ShortcutId id, const QString& text, QObject* parent,
                                      std::function<void()> callback)
{
    if (!parent) {
        return nullptr;
    }
    
    QAction* action = new QAction(text, parent);
    
    if (m_shortcuts.contains(id)) {
        const auto& info = m_shortcuts[id];
        if (!info.keySequence.isEmpty()) {
            action->setShortcut(info.keySequence);
        }
        action->setToolTip(info.description);
    }
    
    if (callback) {
        QObject::connect(action, &QAction::triggered, parent, callback);
    }
    
    return action;
}

QKeySequence ShortcutManager::getKeySequence(ShortcutId id) const
{
    if (m_shortcuts.contains(id)) {
        return m_shortcuts[id].keySequence;
    }
    return QKeySequence();
}

QString ShortcutManager::getDescription(ShortcutId id) const
{
    if (m_shortcuts.contains(id)) {
        return m_shortcuts[id].description;
    }
    return QString();
}

ShortcutManager::ShortcutCategory ShortcutManager::getCategory(ShortcutId id) const
{
    if (m_shortcuts.contains(id)) {
        return m_shortcuts[id].category;
    }
    return Global;
}

QList<ShortcutManager::ShortcutId> ShortcutManager::getShortcutsByCategory(ShortcutCategory category) const
{
    QList<ShortcutId> result;
    for (auto it = m_shortcuts.begin(); it != m_shortcuts.end(); ++it) {
        if (it.value().category == category) {
            result.append(it.key());
        }
    }
    return result;
}

QString ShortcutManager::formatShortcut(ShortcutId id) const
{
    if (!m_shortcuts.contains(id)) {
        return QString();
    }
    
    const auto& info = m_shortcuts[id];
    if (info.keySequence.isEmpty()) {
        return info.description;
    }
    
    return QString("%1 (%2)").arg(info.description).arg(info.keySequence.toString());
}

bool ShortcutManager::hasConflict(const QKeySequence& keySequence, ShortcutId excludeId) const
{
    if (keySequence.isEmpty()) {
        return false;
    }
    
    for (auto it = m_shortcuts.begin(); it != m_shortcuts.end(); ++it) {
        if (it.key() != excludeId && it.value().keySequence == keySequence) {
            return true;
        }
    }
    return false;
}

void ShortcutManager::overrideShortcut(ShortcutId id, const QKeySequence& newSequence)
{
    if (m_shortcuts.contains(id)) {
        m_shortcuts[id].keySequence = newSequence;
        emit shortcutsChanged();
    }
}


void ShortcutManager::resetToDefaults()
{
    m_shortcuts.clear();
    initializeDefaultShortcuts();
    emit shortcutsChanged();
}