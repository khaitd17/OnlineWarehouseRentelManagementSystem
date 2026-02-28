import React from 'react';
import { cn } from '../lib/utils';
import { Link,useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { MENU_ITEMS } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = ({ isCollapsed,onToggle }) => {
    const { pathname } = useLocation();
    const { user } = useAuth();

    const getIcon = (iconName,isActive) => {
        const Icon = LucideIcons[iconName];
        return Icon ? (
            <Icon className={cn(
                "h-5 w-5 transition-transform duration-300",
                isActive ? "scale-110" : "group-hover:scale-110"
            )} />
        ) : (
            <LucideIcons.MoreHorizontal className="h-5 w-5" />
        );
    };

    const filteredMenuItems = MENU_ITEMS.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role);
    });

    return (
        <aside className={cn(
            "bg-primary text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl overflow-hidden",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header / Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                {!isCollapsed && (
                    <Link to="/" className="flex items-center gap-2 animate-in fade-in duration-300">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-inner">
                            <LucideIcons.Box className="text-primary h-5 w-5" />
                        </div>
                        <span className="text-xl font-black tracking-tighter italic">OWRMS</span>
                    </Link>
                )}
                {isCollapsed && (
                    <div className="w-full flex justify-center animate-in fade-in duration-300">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <LucideIcons.Box className="text-primary h-5 w-5 font-bold" />
                        </div>
                    </div>
                )}
                {!isCollapsed && (
                    <button
                        onClick={onToggle}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-white"
                    >
                        <LucideIcons.ChevronLeft size={20} />
                    </button>
                )}
            </div>

            {/* Toggle Button for Collapsed State */}
            {isCollapsed && (
                <div className="flex justify-center py-4 border-b border-white/5">
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white shadow-sm"
                    >
                        <LucideIcons.ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Navigation Items */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {filteredMenuItems.map((item) => {
                    const isActive = pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group relative",
                                isActive
                                    ? "bg-white/15 text-white shadow-md"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-md transition-colors flex shrink-0",
                                isActive ? "bg-white/10" : "group-hover:bg-white/10"
                            )}>
                                {getIcon(item.icon,isActive)}
                            </div>

                            {!isCollapsed && (
                                <span className="truncate animate-in slide-in-from-left-2 duration-300">
                                    {item.name}
                                </span>
                            )}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl border border-white/10">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Footer / Settings */}
            <div className="p-3 border-t border-white/10 bg-black/5">
                <Link
                    to="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                        pathname === "/settings" ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <div className="shrink-0">
                        <LucideIcons.Settings className="h-5 w-5" />
                    </div>
                    {!isCollapsed && (
                        <span className="truncate">Cài đặt</span>
                    )}
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                            Cài đặt
                        </div>
                    )}
                </Link>
            </div>
        </aside>
    );
};
