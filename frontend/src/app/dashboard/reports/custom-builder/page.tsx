'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileCog,
  Plus,
  Trash2,
  Play,
  Save,
  Filter,
  Columns,
  ArrowDownUp,
  Download,
  Eye,
  Edit2,
  BookOpen,
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DATA_SOURCES = [
  { id: 'sales', name: 'فروش‌ها' },
  { id: 'purchases', name: 'خریدها' },
  { id: 'products', name: 'محصولات' },
  { id: 'customers', name: 'مشتریان' },
  { id: 'expenses', name: 'هزینه‌ها' },
];

const ALL_COLUMNS: Record<string, { id: string; name: string }[]> = {
  sales: [
    { id: 'invoiceNumber', name: 'شماره فاکتور' },
    { id: 'saleDate', name: 'تاریخ فروش' },
    { id: 'totalAmount', name: 'مبلغ کل' },
    { id: 'customer.name', name: 'نام مشتری' },
    { id: 'branch.name', name: 'شعبه' },
  ],
  products: [
    { id: 'name', name: 'نام محصول' },
    { id: 'sku', name: 'SKU' },
    { id: 'category', name: 'دسته‌بندی' },
    { id: 'purchasePrice', name: 'قیمت خرید' },
    { id: 'sellingPrice', name: 'قیمت فروش' },
    { id: 'quantity', name: 'موجودی' },
  ],
  // ... Add other sources' columns here
};

const DraggableColumn = ({ id, name, index, moveColumn }: { id: string; name: string; index: number; moveColumn: (from: number, to: number) => void; }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [, drop] = useDrop({
    accept: 'column',
    hover(item: { index: number }) {
      if (!ref.current || item.index === index) return;
      moveColumn(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'column',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-move ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="text-sm">{name}</span>
      <button
        onClick={() => { /* Remove column logic */ }}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};


export default function CustomReportBuilderPage() {
  const [reportName, setReportName] = useState('گزارش سفارشی جدید');
  const [dataSource, setDataSource] = useState('sales');
  const [selectedColumns, setSelectedColumns] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<{ column: string; operator: string; value: string }[]>([]);
  const [sorts, setSorts] = useState<{ column: string; direction: 'asc' | 'desc' }[]>([]);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<{ id: string; name: string }[]>([]);
  
  const addColumn = (column: { id: string, name: string }) => {
    if (!selectedColumns.find(c => c.id === column.id)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };
  
  const moveColumn = (fromIndex: number, toIndex: number) => {
    const updatedColumns = [...selectedColumns];
    const [movedColumn] = updatedColumns.splice(fromIndex, 1);
    updatedColumns.splice(toIndex, 0, movedColumn);
    setSelectedColumns(updatedColumns);
  };
  
  const addFilter = () => {
    setFilters([...filters, { column: '', operator: 'eq', value: '' }]);
  };

  const addSort = () => {
    setSorts([...sorts, { column: '', direction: 'asc' }]);
  };

  const runReport = () => {
    setLoading(true);
    // Placeholder: Simulate API call
    console.log({
      dataSource,
      columns: selectedColumns.map(c => c.id),
      filters,
      sorts,
    });
    setTimeout(() => {
      // This would be replaced by actual data from the backend
      setReportData([
        { invoiceNumber: 'INV-001', totalAmount: 1500000, 'customer.name': 'مشتری ۱' },
        { invoiceNumber: 'INV-002', totalAmount: 2300000, 'customer.name': 'مشتری ۲' },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <FileCog className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">سازنده گزارش سفارشی</h1>
                <p className="text-gray-600 dark:text-gray-400">گزارش‌های خود را بسازید، ذخیره کنید و اجرا کنید.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Builder Panel */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Report Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="h-5 w-5" />
                    تنظیمات گزارش
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">
                      <BookOpen className="h-5 w-5" />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                      <Save className="h-4 w-4" />
                      ذخیره
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام گزارش</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">منبع داده</label>
                  <select
                    value={dataSource}
                    onChange={(e) => {
                      setDataSource(e.target.value);
                      setSelectedColumns([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {DATA_SOURCES.map((source) => (
                      <option key={source.id} value={source.id}>{source.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Columns */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Columns className="h-5 w-5" />
                  ستون‌ها
                </h2>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">افزودن ستون</label>
                  <select
                    onChange={(e) => addColumn(JSON.parse(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option>انتخاب کنید...</option>
                    {(ALL_COLUMNS[dataSource] || []).map(col => (
                      <option key={col.id} value={JSON.stringify(col)}>{col.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  {selectedColumns.map((col, index) => (
                    <DraggableColumn key={col.id} id={col.id} name={col.name} index={index} moveColumn={moveColumn} />
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    فیلترها
                  </h2>
                  <button onClick={addFilter} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {filters.map((filter, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <select className="col-span-1 text-sm ...">
                        <option>انتخاب ستون...</option>
                        {selectedColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select className="col-span-1 text-sm ...">
                        <option value="eq">برابر با</option>
                        <option value="contains">شامل</option>
                      </select>
                      <input type="text" className="col-span-1 text-sm ..."/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sorting */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowDownUp className="h-5 w-5" />
                    مرتب‌سازی
                  </h2>
                  <button onClick={addSort} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {sorts.map((sort, index) => (
                     <div key={index} className="grid grid-cols-2 gap-2">
                      <select className="col-span-1 text-sm ...">
                        <option>انتخاب ستون...</option>
                        {selectedColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select className="col-span-1 text-sm ...">
                        <option value="asc">صعودی</option>
                        <option value="desc">نزولی</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={runReport}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold"
              >
                <Play className="h-5 w-5" />
                <span>{loading ? 'در حال اجرای گزارش...' : 'اجرای گزارش'}</span>
              </button>
            </div>
            
            {/* Results Panel */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  نتایج گزارش
                </h2>
                <button disabled={!reportData} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Download className="h-4 w-4" />
                  خروجی
                </button>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                  </div>
                ) : !reportData ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">برای دیدن نتایج، گزارش را اجرا کنید.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {selectedColumns.map(col => (
                            <th key={col.id} className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {selectedColumns.map(col => (
                              <td key={col.id} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                {row[col.id]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}