import React,{ useState,useRef,useEffect } from 'react';
import { Search,ChevronLeft,ChevronRight,ArrowUpDown,ArrowUp,ArrowDown,MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export function DataTable({
    data = [],
    columns = [],
    totalRecords = 0,
    loading = false,
    page = 1,
    pageSize = 10,
    keyword = "",
    sortBy,
    sortDirection,
    itemName = 'dữ liệu',
    onPageChange = () => { },
    onPageSizeChange = () => { },
    onSearch = () => { },
    onSort = () => { },
    rowActions
}) {
    const [searchValue,setSearchValue] = useState(keyword);
    const [openActionId,setOpenActionId] = useState(null);
    const actionRefs = useRef({});

    const totalPages = Math.ceil(totalRecords / pageSize);
    const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
    const endRecord = Math.min(page * pageSize,totalRecords);

    useEffect(() => {
        setSearchValue(keyword);
    },[keyword]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openActionId !== null && !actionRefs.current[openActionId]?.contains(event.target)) {
                setOpenActionId(null);
            }
        };
        document.addEventListener('mousedown',handleClickOutside);
        return () => document.removeEventListener('mousedown',handleClickOutside);
    },[openActionId]);

    const handleSort = (key) => {
        if (!onSort) return;
        if (sortBy === key) {
            onSort(key,sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            onSort(key,'asc');
        }
    };

    const renderSortIcon = (key) => {
        if (sortBy !== key) return <ArrowUpDown className="h-4 w-4 text-gray-400 opacity-20" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="h-4 w-4 text-primary" />
            : <ArrowDown className="h-4 w-4 text-primary" />;
    };

    return (
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-visible">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            placeholder={`Tìm kiếm ${itemName}...`}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onSearch(searchValue)}
                        />
                    </div>
                    <button
                        onClick={() => onSearch(searchValue)}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        Tìm
                    </button>
                    {keyword && (
                        <button
                            onClick={() => { setSearchValue(""); onSearch(""); }}
                            className="text-gray-400 hover:text-gray-600 text-xs font-medium"
                        >
                            Xóa
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-4 py-4 w-16 text-center">STT</th>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            "px-4 py-4 whitespace-nowrap",
                                            col.sortable && "cursor-pointer select-none hover:bg-gray-100 transition-colors"
                                        )}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.title}
                                            {col.sortable && renderSortIcon(col.key)}
                                        </div>
                                    </th>
                                ))}
                                {rowActions && <th className="px-4 py-4 w-16 text-center">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                            {data.map((item,index) => {
                                const rowId = item.id || item.userId || item.warehouseId || index;
                                return (
                                    <tr key={rowId} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-4 py-4 text-center text-gray-400">{(page - 1) * pageSize + index + 1}</td>
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-4 py-4 whitespace-nowrap">
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                        {rowActions && (
                                            <td className="px-4 py-4 text-center relative overflow-visible">
                                                <div ref={el => actionRefs.current[rowId] = el} className="relative inline-block text-left">
                                                    <button
                                                        onClick={() => setOpenActionId(openActionId === rowId ? null : rowId)}
                                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                                                    >
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </button>

                                                    {openActionId === rowId && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-gray-100 z-[100] py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                            {rowActions(item).map((action,i) => (
                                                                !action.hidden && (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => {
                                                                            action.onClick();
                                                                            setOpenActionId(null);
                                                                        }}
                                                                        className={cn(
                                                                            "w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors font-medium",
                                                                            action.className || "text-gray-700 hover:bg-gray-50"
                                                                        )}
                                                                    >
                                                                        {action.icon}
                                                                        {action.label}
                                                                    </button>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length + (rowActions ? 2 : 1)} className="px-4 py-12 text-center text-gray-400 italic">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-3 font-semibold">
                    <span>Hiển thị {startRecord} - {endRecord} trong {totalRecords}</span>
                    <select
                        className="bg-gray-50 border-none rounded-md text-xs px-2 py-1 focus:ring-1 focus:ring-primary/20 outline-none cursor-pointer font-bold"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        <option value={10}>10 dòng</option>
                        <option value={20}>20 dòng</option>
                        <option value={50}>50 dòng</option>
                    </select>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="px-4 flex items-center gap-1">
                            <span className="text-gray-900 font-black">{page}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-500 font-bold">{totalPages}</span>
                        </div>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
