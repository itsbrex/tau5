#ifndef SHORTCUTMANAGER_H
#define SHORTCUTMANAGER_H

#include <QObject>
#include <QKeySequence>
#include <QHash>
#include <QString>
#include <functional>

class QShortcut;
class QWidget;
class QAction;

class ShortcutManager : public QObject
{
    Q_OBJECT

public:
    // Shortcut categories
    enum ShortcutCategory {
        Global,
        DebugPane,
        Editor,
        Navigation,
        View,
        Help
    };

    // Shortcut IDs
    enum ShortcutId {
        // Global shortcuts
        ToggleDebugPane,
        ToggleFullScreen,
        
        // Debug pane shortcuts
        DebugPaneSearch,
        DebugPaneFindNext,
        DebugPaneFindPrevious,
        DebugPaneCloseSearch,
        
        // View shortcuts
        ZoomIn,
        ZoomOut,
        ZoomReset,
        
        // Navigation shortcuts
        ResetBrowser,
        OpenExternalBrowser,
        
        // Help shortcuts
        ShowHelp,
        ShowAbout
    };

    static ShortcutManager& instance();

    // Register shortcuts
    void registerShortcut(ShortcutId id, const QKeySequence& keySequence, 
                         const QString& description, ShortcutCategory category = Global);
    
    // Create QShortcut for a widget
    QShortcut* createShortcut(ShortcutId id, QWidget* parent, 
                             std::function<void()> callback,
                             Qt::ShortcutContext context = Qt::WindowShortcut);
    
    // Create QAction with shortcut
    QAction* createAction(ShortcutId id, const QString& text, QObject* parent,
                         std::function<void()> callback);
    
    // Get shortcut information
    QKeySequence getKeySequence(ShortcutId id) const;
    QString getDescription(ShortcutId id) const;
    ShortcutCategory getCategory(ShortcutId id) const;
    
    // Get all shortcuts in a category
    QList<ShortcutId> getShortcutsByCategory(ShortcutCategory category) const;
    
    // Format shortcut for display
    QString formatShortcut(ShortcutId id) const;
    
    // Check if a key sequence conflicts with existing shortcuts
    bool hasConflict(const QKeySequence& keySequence, ShortcutId excludeId = static_cast<ShortcutId>(-1)) const;
    
    // Override a specific shortcut (for future scheme loading)
    void overrideShortcut(ShortcutId id, const QKeySequence& newSequence);
    
    // Reset to default shortcuts
    void resetToDefaults();

signals:
    void shortcutsChanged();

private:
    ShortcutManager();
    ~ShortcutManager() = default;
    ShortcutManager(const ShortcutManager&) = delete;
    ShortcutManager& operator=(const ShortcutManager&) = delete;

    void initializeDefaultShortcuts();

    struct ShortcutInfo {
        QKeySequence keySequence;
        QString description;
        ShortcutCategory category;
    };

    QHash<ShortcutId, ShortcutInfo> m_shortcuts;
};

#endif // SHORTCUTMANAGER_H