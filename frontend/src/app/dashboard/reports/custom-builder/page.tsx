'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileCog, Plus, Trash2, Play, Save, Filter, Columns, ArrowDownUp, Download, Eye, Edit2, BookOpen, GripVertical
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ItemTypes } from './dndTypes'; // A simple helper file for DnD types

const DATA_SCHEMA = {
  sales: {
    name: 'فروش‌ها',
    columns: [
      { id: 'invoiceNumber', name: 'شماره فاکتور', type: 'string' },
      { id: 'saleDate', name: 'تاریخ فروش', type: 'date' },
      { id: 'subtotal', name: 'جمع جزء', type: 'number' },
      { id: 'taxAmount', name: 'مبلغ مالیات', type: 'number' },
      { id: 'discountAmount', name: 'مبلغ تخفیف', type: 'number' },
      { id: 'totalAmount', name: 'مبلغ کل', type: 'number' },
      { id: 'paidAmount', name: 'مبلغ پرداختی', type: 'number' },
      { id: 'status', name: 'وضعیت', type: 'enum', options: ['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
      { id: 'paymentMethod', name: 'روش پرداخت', type: 'enum', options: ['CASH', 'CHECK', 'BANK_TRANSFER', 'CARD', 'INSTALLMENT', 'TRADE_IN', 'MIXED'] },
    ],
    relations: {
      customer: {
        name: 'مشتری',
        columns: [
          { id: 'customer.firstName', name: 'نام مشتری', type: 'string' },
          { id: 'customer.lastName', name: 'نام خانوادگی مشتری', type: 'string' },
          { id: 'customer.businessName', name: 'نام کسب‌وکار مشتری', type: 'string' },
          { id: 'customer.phone', name: 'تلفن مشتری', type: 'string' },
          { id: 'customer.city', name: 'شهر مشتری', type: 'string' },
          { id: 'customer.type', name: 'نوع مشتری', type: 'enum', options: ['INDIVIDUAL', 'BUSINESS'] },
        ]
      },
      branch: {
        name: 'شعبه',
        columns: [
          { id: 'branch.name', name: 'نام شعبه', type: 'string' },
          { id: 'branch.code', name: 'کد شعبه', type: 'string' },
        ]
      },
      user: {
        name: 'کاربر (فروشنده)',
        columns: [
          { id: 'user.firstName', name: 'نام فروشنده', type: 'string' },
          { id: 'user.lastName', name: 'نام خانوادگی فروشنده', type: 'string' },
          { id: 'user.username', name: 'نام کاربری فروشنده', type: 'string' },
        ]
      }
    }
  },
  purchases: {
    name: 'خریدها',
    columns: [
      { id: 'purchaseNumber', name: 'شماره خرید', type: 'string' },
      { id: 'purchaseDate', name: 'تاریخ خرید', type: 'date' },
      { id: 'totalAmount', name: 'مبلغ کل', type: 'number' },
      { id: 'paidAmount', name: 'مبلغ پرداختی', type: 'number' },
      { id: 'status', name: 'وضعیت', type: 'enum', options: ['PENDING', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'] },
    ],
    relations: {
      supplier: {
        name: 'تامین‌کننده',
        columns: [
          { id: 'supplier.name', name: 'نام تامین‌کننده', type: 'string' },
          { id: 'supplier.city', name: 'شهر تامین‌کننده', type: 'string' },
        ]
      },
      branch: {
        name: 'شعبه',
        columns: [
          { id: 'branch.name', name: 'نام شعبه', type: 'string' },
        ]
      }
    }
  },
  products: {
    name: 'محصولات (موجودی)',
    columns: [
      { id: 'name', name: 'نام محصول', type: 'string' },
      { id: 'sku', name: 'SKU', type: 'string' },
      { id: 'category', name: 'دسته‌بندی', type: 'enum', options: ['RAW_GOLD', 'MANUFACTURED_PRODUCT', 'STONE', 'COIN', 'CURRENCY', 'GENERAL_GOODS'] },
      { id: 'status', name: 'وضعیت', type: 'enum', options: ['IN_STOCK', 'SOLD', 'RESERVED', 'IN_WORKSHOP', 'RETURNED', 'DAMAGED'] },
      { id: 'purchasePrice', name: 'قیمت خرید', type: 'number' },
      { id: 'sellingPrice', name: 'قیمت فروش', type: 'number' },
      { id: 'quantity', name: 'موجودی', type: 'number' },
      { id: 'weight', name: 'وزن', type: 'number' },
      { id: 'goldPurity', name: 'عیار طلا', type: 'enum', options: ['K18', 'K21', 'K22', 'K24'] },
    ],
    relations: {
      workshop: {
        name: 'کارگاه',
        columns: [
          { id: 'workshop.name', name: 'نام کارگاه', type: 'string' },
        ]
      }
    }
  },
  customers: {
    name: 'مشتریان',
    columns: [
      { id: 'code', name: 'کد', type: 'string' },
      { id: 'firstName', name: 'نام', type: 'string' },
      { id: 'lastName', name: 'نام خانوادگی', type: 'string' },
      { id: 'phone', name: 'تلفن', type: 'string' },
      { id: 'city', name: 'شهر', type: 'string' },
      { id: 'currentBalance', name: 'بدهی فعلی', type: 'number' },
      { id: 'creditLimit', name: 'سقف اعتبار', type: 'number' },
      { id: 'loyaltyPoints', name: 'امتیاز وفاداری', type: 'number' },
      { id: 'type', name: 'نوع', type: 'enum', options: ['INDIVIDUAL', 'BUSINESS'] },
      { id: 'status', name: 'وضعیت', type: 'enum', options: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'] },
    ],
    relations: {}
  },
  suppliers: {
    name: 'تامین‌کنندگان',
    columns: [
      { id: 'code', name: 'کد', type: 'string' },
      { id: 'name', name: 'نام', type: 'string' },
      { id: 'phone', name: 'تلفن', type: 'string' },
      { id: 'city', name: 'شهر', type: 'string' },
      { id: 'rating', name: 'امتیاز', type: 'number' },
      { id: 'status', name: 'وضعیت', type: 'enum', options: ['ACTIVE', 'INACTIVE', 'BLACKLISTED'] },
    ],
    relations: {}
  },
  expenses: {
    name: 'هزینه‌ها',
    columns: [
      { id: 'title', name: 'عنوان', type: 'string' },
      { id: 'expenseDate', name: 'تاریخ هزینه', type: 'date' },
      { id: 'amount', name: 'مبلغ', type: 'number' },
      { id: 'vendor', name: 'فروشنده/گیرنده', type: 'string' },
      { id: 'isRecurring', name: 'تکرارشونده؟', type: 'boolean' },
    ],
    relations: {
      category: {
        name: 'دسته‌بندی هزینه',
        columns: [
          { id: 'category.name', name: 'نام دسته‌بندی', type: 'string' },
        ]
      }
    }
  },
  employees: {
    name: 'کارمندان',
    columns: [
      { id: 'employeeCode', name: 'کد کارمند', type: 'string' },
      { id: 'firstName', name: 'نام', type: 'string' },
      { id: 'lastName', name: 'نام خانوادگی', type: 'string' },
      { id: 'position', name: 'موقعیت شغلی', type: 'string' },
      { id: 'department', name: 'دپارتمان', type: 'string' },
      { id: 'baseSalary', name: 'حقوق پایه', type: 'number' },
      { id: 'status', name: 'وضعیت', type: 'enum', options: ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED'] },
    ],
    relations: {
      branch: {
        name: 'شعبه',
        columns: [
          { id: 'branch.name', name: 'شعبه کارمند', type: 'string' },
        ]
      }
    }
  }
};

const OPERATORS: Record<string, { id: string, name: string }[]> = {
  string: [
    { id: 'eq', name: 'برابر با' },
    { id: 'neq', name: 'مخالف با' },
    { id: 'contains', name: 'شامل' },
    { id: 'startsWith', name: 'شروع شود با' },
  ],
  number: [
    { id: 'eq', name: '=' },
    { id: 'neq', name: '!=' },
    { id: 'gt', name: '>' },
    { id: 'gte', name: '>=' },
    { id: 'lt', name: '<' },
    { id: 'lte', name: '<=' },
  ],
  date: [
    { id: 'eq', name: 'در تاریخ' },
    { id: 'gte', name: 'از تاریخ' },
    { id: 'lte', name: 'تا تاریخ' },
  ],
  enum: [
    { id: 'eq', name: 'برابر با' },
    { id: 'in', name: 'یکی از' },
  ]
};

// --- Draggable Column Component ---
const DraggableColumn = ({ id, name, index, moveColumn, removeColumn }: { id: string; name: string; index: number; moveColumn: (from: number, to: number) => void; removeColumn: (id: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [, drop] = useDrop({
    accept: ItemTypes.COLUMN,
    hover(item: { index: number }) {
      if (!ref.current || item.index === index) return;
      moveColumn(item.index, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.COLUMN,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex items-center gap-2">
        <button {...drag} className="cursor-move p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-sm">{name}</span>
      </div>
      <button
        onClick={() => removeColumn(id)}
        className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};


export default function CustomReportBuilderPage() {
  // Report Configuration State
  const [reportName, setReportName] = useState('گزارش سفارشی جدید');
  const [dataSource, setDataSource] = useState('sales');
  const [selectedColumns, setSelectedColumns] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<{ id: number; column: string; operator: string; value: string }[]>([]);
  const [sorts, setSorts] = useState<{ id: number; column: string; direction: 'asc' | 'desc' }[]>([]);

  // UI State
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<Record<string, { id: string; name: string; type: string; options?: string[] }[]>>({});

  useEffect(() => {
    const sourceSchema = DATA_SCHEMA[dataSource as keyof typeof DATA_SCHEMA];
    if (sourceSchema) {
      let allCols: Record<string, any[]> = { [sourceSchema.name]: sourceSchema.columns };
      for (const relKey in sourceSchema.relations) {
        const relation: any = sourceSchema.relations[relKey as keyof typeof sourceSchema.relations];
        allCols[relation.name] = relation.columns;
      }
      setAvailableColumns(allCols);
    }
  }, [dataSource]);
  
  const addColumn = (col: { id: string, name: string }) => {
    if (!selectedColumns.find(c => c.id === col.id)) {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const removeColumn = (id: string) => {
    setSelectedColumns(selectedColumns.filter(c => c.id !== id));
  };
  
  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    const dragItem = selectedColumns[dragIndex];
    const newItems = [...selectedColumns];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setSelectedColumns(newItems);
  }, [selectedColumns]);
  
  const addFilter = () => setFilters([...filters, { id: Date.now(), column: '', operator: 'eq', value: '' }]);
  const removeFilter = (id: number) => setFilters(filters.filter(f => f.id !== id));
  const updateFilter = (id: number, field: string, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  
  const addSort = () => setSorts([...sorts, { id: Date.now(), column: '', direction: 'asc' }]);
  const removeSort = (id: number) => setSorts(sorts.filter(s => s.id !== id));
  const updateSort = (id: number, field: string, value: string) => {
    setSorts(sorts.map(s => s.id === id ? { ...s, [field]: value } as any : s));
  };

  const runReport = () => {
    setLoading(true);
    console.log("Running report with config:", { dataSource, selectedColumns, filters, sorts });
    // In a real app, this would be a POST request to a backend endpoint like /api/reports/custom/run
    setTimeout(() => {
      // Dummy data for demonstration
      const dummyData = [
        { invoiceNumber: 'INV-001', saleDate: '2025-10-26', totalAmount: 1500000, "customer.name": 'مشتری ۱' },
        { invoiceNumber: 'INV-002', saleDate: '2025-10-27', totalAmount: 2300000, "customer.name": 'مشتری ۲' },
      ];
      setReportData(dummyData);
      setLoading(false);
    }, 1500);
  };
  
  const getColumnType = (columnId: string) => {
    for (const group in availableColumns) {
      const col = availableColumns[group].find(c => c.id === columnId);
      if (col) return col.type;
    }
    return 'string';
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
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Edit2 className="h-5 w-5" />تنظیمات گزارش</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">منبع داده اصلی</label>
                  <select
                    value={dataSource}
                    onChange={(e) => {
                      setDataSource(e.target.value);
                      setSelectedColumns([]);
                      setFilters([]);
                      setSorts([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {Object.entries(DATA_SCHEMA).map(([id, schema]) => (
                      <option key={id} value={id}>{schema.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Columns className="h-5 w-5" />ستون‌ها</h2>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">افزودن ستون</label>
                  <select
                    onChange={(e) => addColumn(JSON.parse(e.target.value))}
                    value=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="" disabled>انتخاب ستون...</option>
                    {Object.entries(availableColumns).map(([groupName, cols]) => (
                      <optgroup key={groupName} label={groupName}>
                        {cols.map(col => (
                          <option key={col.id} value={JSON.stringify(col)}>{col.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {selectedColumns.map((col, index) => (
                    <DraggableColumn key={col.id} id={col.id} name={col.name} index={index} moveColumn={moveColumn} removeColumn={removeColumn} />
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Filter className="h-5 w-5" />فیلترها</h2>
                  <button onClick={addFilter} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-300 dark:hover:bg-gray-700"><Plus className="h-5 w-5" /></button>
                </div>
                <div className="space-y-3">
                  {filters.map((filter) => (
                    <div key={filter.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <select value={filter.column} onChange={(e) => updateFilter(filter.id, 'column', e.target.value)} className="col-span-2 text-sm w-full px-2 py-1.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="">انتخاب ستون...</option>
                        {Object.values(availableColumns).flat().map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <select value={filter.operator} onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)} className="text-sm w-full px-2 py-1.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        {(OPERATORS[getColumnType(filter.column)] || OPERATORS.string).map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
                      </select>
                      <div className="flex items-center gap-1">
                        <input type="text" value={filter.value} onChange={(e) => updateFilter(filter.id, 'value', e.target.value)} className="text-sm w-full px-2 py-1.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        <button onClick={() => removeFilter(filter.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><ArrowDownUp className="h-5 w-5" />مرتب‌سازی</h2>
                  <button onClick={addSort} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-300 dark:hover:bg-gray-700"><Plus className="h-5 w-5" /></button>
                </div>
                <div className="space-y-3">
                  {sorts.map((sort) => (
                    <div key={sort.id} className="grid grid-cols-3 gap-2 items-center">
                      <select value={sort.column} onChange={(e) => updateSort(sort.id, 'column', e.target.value)} className="col-span-2 text-sm w-full px-2 py-1.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="">انتخاب ستون...</option>
                        {selectedColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="flex items-center gap-1">
                        <select value={sort.direction} onChange={(e) => updateSort(sort.id, 'direction', e.target.value)} className="text-sm w-full px-2 py-1.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                          <option value="asc">صعودی</option>
                          <option value="desc">نزولی</option>
                        </select>
                        <button onClick={() => removeSort(sort.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={runReport} disabled={loading || selectedColumns.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold transition-all">
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Play className="h-5 w-5" />}
                <span>{loading ? 'در حال اجرای گزارش...' : 'اجرای گزارش'}</span>
              </button>
            </div>
            
            {/* Results Panel */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Eye className="h-5 w-5" />نتایج گزارش</h2>
                <button disabled={!reportData} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Download className="h-4 w-4" />
                  خروجی
                </button>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>
                ) : !reportData ? (
                  <div className="text-center py-16 text-gray-500 dark:text-gray-400">برای دیدن نتایج، گزارش را پیکربندی و اجرا کنید.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {selectedColumns.map(col => (
                            <th key={col.id} className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{col.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {selectedColumns.map(col => (
                              <td key={col.id} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{row[col.id] ?? '–'}</td>
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