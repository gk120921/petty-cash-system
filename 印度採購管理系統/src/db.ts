// ============================================================
// WMS v2.0 — 資料庫引擎 (LocalStorage-based)
// 規則: Create 對應 Update + Delete
//       Delete 有關聯防護
//       所有庫存異動皆先寫 AuditLog
// ============================================================

import type {
  StorageLocation,
  Product,
  InventoryBatch,
  IssueRecord,
  AuditLog,
  InventoryWithRemaining,
  ProductStockSummary,
  Unit,
  InboundCategory,
  WarehouseCategory,
  TransactionType,
} from './types';

// ── Storage Keys ───────────────────────────────────────────
const KEYS = {
  LOCATIONS:   'wms_locations',
  PRODUCTS:    'wms_products',
  INVENTORY:   'wms_inventory',
  ISSUES:      'wms_issues',
  AUDIT:       'wms_audit_log',
  QC_STATUS:   'wms_qc_status',
};

// ── Generic Helpers ────────────────────────────────────────
function today(): string { return new Date().toISOString().split('T')[0]; }
function now(): string { return new Date().toISOString(); }

// ── Database Sync (FileSystem via Vite API) ────────────────
export const DatabaseSync = {
  pull: async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      Object.entries(data).forEach(([key, val]) => {
        if (val) localStorage.setItem(key, val as string);
      });
      console.log('✓ Data synced from filesystem');
      return true;
    } catch (e) {
      console.error('Failed to pull data:', e);
      return false;
    }
  },
  push: async () => {
    try {
      const data: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wms_')) {
          data[key] = localStorage.getItem(key);
        }
      }
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error('Failed to push data:', e);
    }
  }
};

// ── Generic Helpers ────────────────────────────────────────
function getList<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T[]) : [];
}
function saveList<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
  DatabaseSync.push(); // 背景同步到檔案系統
}
function genId(): string { return crypto.randomUUID(); }

// ── Case Number Generator (v2: 儲位+日期+流水) ─────────────
function generateCaseNo(shelfLocation: string): string {
  const inventory = getList<InventoryBatch>(KEYS.INVENTORY);
  const dateStr = today().replace(/-/g, '');
  const prefix = `${shelfLocation}-${dateStr}`;
  const todayCount = inventory.filter(i => i.caseNo.startsWith(prefix)).length;
  const serial = String(todayCount + 1).padStart(4, '0');
  return `${prefix}-${serial}`;
}

// 批量產生 N 個箱號
function generateCaseNoBatch(shelfLocation: string, count: number): string[] {
  const inventory = getList<InventoryBatch>(KEYS.INVENTORY);
  const dateStr = today().replace(/-/g, '');
  const prefix = `${shelfLocation}-${dateStr}`;
  const existCount = inventory.filter(i => i.caseNo.startsWith(prefix)).length;
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(`${prefix}-${String(existCount + i + 1).padStart(4, '0')}`);
  }
  return results;
}

// ============================================================
// 儲位管理 (Locations)
// ============================================================
export const LocationDB = {
  getAll: (): StorageLocation[] => getList<StorageLocation>(KEYS.LOCATIONS),

  getActive: (): StorageLocation[] =>
    LocationDB.getAll().filter(l => l.isActive),

  create: (data: { warehouseCode: string; warehouseCategory: WarehouseCategory; shelfLocation: string; description: string }): StorageLocation => {
    const list = LocationDB.getAll();
    const dup = list.find(
      l => l.warehouseCode === data.warehouseCode && l.shelfLocation === data.shelfLocation
    );
    if (dup) throw new Error(`儲位 ${data.warehouseCode}-${data.shelfLocation} 已存在`);
    const item: StorageLocation = {
      ...data,
      locationId: genId(),
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    };
    saveList(KEYS.LOCATIONS, [...list, item]);
    return item;
  },

  update: (locationId: string, data: Partial<Pick<StorageLocation, 'description' | 'isActive' | 'warehouseCategory'>>): StorageLocation => {
    const list = LocationDB.getAll();
    const idx = list.findIndex(l => l.locationId === locationId);
    if (idx === -1) throw new Error('儲位不存在');
    list[idx] = { ...list[idx], ...data, updatedAt: now() };
    saveList(KEYS.LOCATIONS, list);
    return list[idx];
  },

  delete: (locationId: string): void => {
    const loc = LocationDB.getAll().find(l => l.locationId === locationId);
    if (!loc) throw new Error('儲位不存在');
    const inventory = getList<InventoryBatch>(KEYS.INVENTORY);
    const inUse = inventory.some(
      i => i.warehouseCode === loc.warehouseCode && i.shelfLocation === loc.shelfLocation
    );
    if (inUse) throw new Error('此儲位尚有庫存記錄，無法刪除');
    saveList(KEYS.LOCATIONS, LocationDB.getAll().filter(l => l.locationId !== locationId));
  },

  seedDefaults: () => {
    // 如果已有資料則不重複執行 (除非手動觸發)
    if (LocationDB.getAll().length > 0) return;

    const defaults = [
      // 1. 一般倉庫 (NORMAL)
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A01', description: '儲位架 warehouse' },
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A02', description: '儲位架 warehouse' },
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A03', description: '儲位架 warehouse' },
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A04', description: '儲位架 warehouse' },
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A05', description: '儲位架 warehouse' },
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A06', description: '儲位架 warehouse' },
      { warehouseCode: 'WS001', warehouseCategory: 'NORMAL' as const, shelfLocation: 'A07', description: '儲位架 warehouse' },

      // 2. 委外倉 (SUB)
      { warehouseCode: 'SD001', warehouseCategory: 'SUB' as const, shelfLocation: '01', description: '委外電鍍供應商 Outsourced electroplating supplier' },

      // 3. 製程倉 (PROCESS)
      { warehouseCode: 'I311', warehouseCategory: 'PROCESS' as const, shelfLocation: 'MAIN', description: '沖壓倉 stamping chamber' },
      { warehouseCode: 'I312', warehouseCategory: 'PROCESS' as const, shelfLocation: 'MAIN', description: '焊接倉 welding chamber' },
      { warehouseCode: 'I313', warehouseCategory: 'PROCESS' as const, shelfLocation: 'MAIN', description: '射出倉 injection chamber' },
      { warehouseCode: 'I314', warehouseCategory: 'PROCESS' as const, shelfLocation: 'MAIN', description: '裝配倉 assembly chamber' },
      { warehouseCode: 'I330', warehouseCategory: 'PROCESS' as const, shelfLocation: 'MAIN', description: '充電槍倉 charging gun chamber' },
      { warehouseCode: 'WM00', warehouseCategory: 'PROCESS' as const, shelfLocation: 'MAIN', description: '物料倉 material warehouse.' },
    ];

    defaults.forEach(d => {
      try {
        LocationDB.create(d);
      } catch (e) {
        console.error('Seed error:', e);
      }
    });
  },
};

// ============================================================
// 產品主檔 (BOM)
// ============================================================
export const ProductDB = {
  getAll: (): Product[] => getList<Product>(KEYS.PRODUCTS),

  create: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Product => {
    const list = ProductDB.getAll();
    if (list.find(p => p.productName === data.productName))
      throw new Error(`產品 "${data.productName}" 已存在`);
    const item: Product = { ...data, productId: genId(), createdAt: now(), updatedAt: now() };
    saveList(KEYS.PRODUCTS, [...list, item]);
    return item;
  },

  update: (productId: string, data: Partial<Omit<Product, 'productId' | 'createdAt'>>): Product => {
    const list = ProductDB.getAll();
    const idx = list.findIndex(p => p.productId === productId);
    if (idx === -1) throw new Error('產品不存在');
    list[idx] = { ...list[idx], ...data, updatedAt: now() };
    saveList(KEYS.PRODUCTS, list);
    return list[idx];
  },

  delete: (productId: string): void => {
    const product = ProductDB.getAll().find(p => p.productId === productId);
    if (!product) throw new Error('產品不存在');
    const inventory = getList<InventoryBatch>(KEYS.INVENTORY);
    if (inventory.some(i => i.productName === product.productName))
      throw new Error('此產品尚有庫存記錄，無法刪除');
    saveList(KEYS.PRODUCTS, ProductDB.getAll().filter(p => p.productId !== productId));
  },

  findByName: (name: string): Product | undefined =>
    ProductDB.getAll().find(p => p.productName === name),

  seedDefaults: () => {
    if (ProductDB.getAll().length > 0) return;
    const defaults: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>[] = [
      // 3.2 系列 (今日提到)
      { productName: 'c0.75*24H/2', spec: '銅板原料 Copper Plate', defaultLocation: 'WM00', parentProductName: '', conversionRate: 1, baseUnit: 'pcs', altUnit: 'kg' },
      { productName: 'RO1-3.2', spec: '沖壓半成品 Stamping', defaultLocation: 'I311', parentProductName: 'c0.75*24H/2', conversionRate: 0.000020, baseUnit: 'pcs', altUnit: 'kg' },
      { productName: 'ROB1-3.2', spec: '焊接半成品 Welding', defaultLocation: 'I312', parentProductName: 'RO1-3.2', conversionRate: 0.000020, baseUnit: 'pcs', altUnit: 'kg' },
      { productName: 'RNB1-3.2', spec: '電鍍成品 Plating/Finish', defaultLocation: 'WS001', parentProductName: 'ROB1-3.2', conversionRate: 0.000020, baseUnit: 'pcs', altUnit: 'kg' },
      
      // 3.4 系列 (過去測試資料)
      { productName: 'RO1-3.4', spec: '沖壓半成品 Stamping (Test)', defaultLocation: 'I311', parentProductName: 'c0.75*24H/2', conversionRate: 0.000020, baseUnit: 'pcs', altUnit: 'kg' },
      { productName: 'ROB1-3.4', spec: '焊接半成品 Welding (Test)', defaultLocation: 'I312', parentProductName: 'RO1-3.4', conversionRate: 0.000020, baseUnit: 'pcs', altUnit: 'kg' },
      { productName: 'RNB1-3.4', spec: '電鍍成品 Plating/Finish (Test)', defaultLocation: 'WS001', parentProductName: 'ROB1-3.4', conversionRate: 0.000020, baseUnit: 'pcs', altUnit: 'kg' },
    ];
    defaults.forEach(d => ProductDB.create(d));
  }
};

// ============================================================
// 品質狀態管理 (QC Status)
// ============================================================
export const QCStatusDB = {
  getAll: (): QCStatus[] => getList<QCStatus>(KEYS.QC_STATUS),

  getActive: (): QCStatus[] =>
    QCStatusDB.getAll().filter(q => q.isActive),

  create: (data: Omit<QCStatus, 'isActive'>): QCStatus => {
    const list = QCStatusDB.getAll();
    if (list.find(q => q.code === data.code))
      throw new Error(`品檢碼 "${data.code}" 已存在`);
    const item: QCStatus = { ...data, isActive: true };
    saveList(KEYS.QC_STATUS, [...list, item]);
    return item;
  },

  update: (code: string, data: Partial<Omit<QCStatus, 'code'>>): QCStatus => {
    const list = QCStatusDB.getAll();
    const idx = list.findIndex(q => q.code === code);
    if (idx === -1) throw new Error('品檢碼不存在');
    list[idx] = { ...list[idx], ...data };
    saveList(KEYS.QC_STATUS, list);
    return list[idx];
  },

  delete: (code: string): void => {
    if (code === 'OK') throw new Error('核心品檢碼 "OK" 不可刪除');
    const inventory = getList<InventoryBatch>(KEYS.INVENTORY);
    if (inventory.some(i => i.qcStatus === code))
      throw new Error('尚有庫存批次使用此品檢碼，無法刪除');
    saveList(KEYS.QC_STATUS, QCStatusDB.getAll().filter(q => q.code !== code));
  },

  seedDefaults: () => {
    if (QCStatusDB.getAll().length > 0) return;
    const defaults: Omit<QCStatus, 'isActive'>[] = [
      { code: 'A', name: '合格品', nameEn: 'Approved/Pass', color: '#22c55e', canOutbound: true,  canProduce: true,  restrictedCustomers: '', prohibitedCustomers: '', description: '該批物料品質經由檢驗判定合格者。' },
      { code: 'B', name: '重工品', nameEn: 'Rework', color: '#3b82f6', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '該批物料須進行重工，完成後需通知品保複驗合格後方可進入下製程。' },
      { code: 'C', name: '不合格品', nameEn: 'Reject/NC', color: '#ef4444', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '須執行退貨/申請特採中/預備報廢之物料。' },
      { code: 'D', name: '特採品', nameEn: 'Concession', color: '#d946ef', canOutbound: true,  canProduce: true,  restrictedCustomers: '', prohibitedCustomers: '', description: '經特採申請核准通過。禁出/限出特定客戶者。' },
      { code: 'E', name: '全檢', nameEn: '100% Inspection', color: '#3b82f6', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '須進行全檢，完成後需通知品保複驗合格後方可進入下製程。' },
      { code: 'F', name: '長時間驗證', nameEn: 'Validation', color: '#3b82f6', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '需要長時間驗證的異常品。' },
      { code: 'P', name: '報廢品', nameEn: 'Scrap', color: '#ef4444', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '報廢會審程序之物料。' },
      { code: 'W', name: '待檢驗品', nameEn: 'Pending Inspection', color: '#eab308', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '進料檢驗中，其它不可使用。' },
      { code: 'L', name: '生管課專用', nameEn: 'Planning Dept Only', color: '#3b82f6', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '僅開放生管課使用於鎖定及監控特殊出貨。' },
      { code: 'S', name: '裝運課專用', nameEn: 'Logistics Only', color: '#3b82f6', canOutbound: false, canProduce: false, restrictedCustomers: '', prohibitedCustomers: '', description: '僅開放裝運課使用於監控特殊出貨/包裝。' },
      { code: 'T', name: '裝運課專用(T08AY)', nameEn: 'Customer T08AY Only', color: '#3b82f6', canOutbound: true,  canProduce: true,  restrictedCustomers: 'T08AY', prohibitedCustomers: '', description: '僅開放裝運課使用於監控預定提供 T08AY 客戶指定之合格物料。' },
    ];
    defaults.forEach(d => QCStatusDB.create(d));
  }
};

// ============================================================
// 庫存主檔 (Inventory)
// ============================================================
export const InventoryDB = {
  getAll: (): InventoryBatch[] => getList<InventoryBatch>(KEYS.INVENTORY),

  // ── 單筆入庫 ──
  create: (data: {
    category: InboundCategory;
    orderNo: string;
    warehouseCode: string;
    shelfLocation: string;
    productName: string;
    batchNo: string;
    receiveDate: string;
    quantity: number;
    unit: Unit;
    conversionRate?: number;
    operator: string;
    customRemark?: string; // 新增自定義備註
  }): InventoryBatch => {
    const caseNo = generateCaseNo(data.shelfLocation);

    let quantityPcs: number | undefined;
    let quantityKg: number | undefined;
    if (data.unit === 'kg' && data.conversionRate) {
      quantityKg = data.quantity;
      quantityPcs = Math.round((data.quantity / data.conversionRate) * 1000000) / 1000000;
    } else if (data.unit === 'pcs') {
      quantityPcs = data.quantity;
    }

    const item: InventoryBatch = {
      batchId: genId(),
      caseNo,
      category: data.category,
      orderNo: data.orderNo,
      warehouseCode: data.warehouseCode,
      shelfLocation: data.shelfLocation,
      productName: data.productName,
      batchNo: data.batchNo,
      receiveDate: data.receiveDate,
      quantity: data.quantity,
      unit: data.unit,
      quantityKg,
      quantityPcs,
      conversionRate: data.conversionRate,
      status: 'ACTIVE',
      qcStatus: 'A',
      operator: data.operator,
      createdAt: now(),
      updatedAt: now(),
    };

    const list = InventoryDB.getAll();
    saveList(KEYS.INVENTORY, [...list, item]);

    AuditDB.write({
      batchId: item.batchId,
      productName: item.productName,
      transactionType: 'INBOUND',
      orderNo: data.orderNo,
      qtyBefore: 0,
      qtyChanged: item.quantity,
      qtyAfter: item.quantity,
      operator: data.operator,
      remark: data.customRemark || `入庫: ${item.caseNo}`,
    });
    return item;
  },

  // ── 多箱批次入庫 ──
  createBatch: (data: {
    category: InboundCategory;
    orderNo: string;
    warehouseCode: string;
    shelfLocation: string;
    productName: string;
    batchNo: string;
    receiveDate: string;
    quantities: number[];
    unit: Unit;
    conversionRate?: number;
    operator: string;
    customRemark?: string;
  }): InventoryBatch[] => {
    const boxCount = data.quantities.length;
    const caseNos = generateCaseNoBatch(data.shelfLocation, boxCount);
    const results: InventoryBatch[] = [];
    const list = InventoryDB.getAll();

    caseNos.forEach((caseNo, idx) => {
      const qty = data.quantities[idx];
      let quantityPcs: number | undefined;
      let quantityKg: number | undefined;

      if (data.unit === 'kg' && data.conversionRate) {
        quantityKg = qty;
        quantityPcs = Math.round((qty / data.conversionRate) * 1000000) / 1000000;
      } else if (data.unit === 'pcs') {
        quantityPcs = qty;
      }

      const item: InventoryBatch = {
        batchId: genId(),
        caseNo,
        category: data.category,
        orderNo: data.orderNo,
        warehouseCode: data.warehouseCode,
        shelfLocation: data.shelfLocation,
        productName: data.productName,
        batchNo: data.batchNo,
        receiveDate: data.receiveDate,
        quantity: qty,
        unit: data.unit,
        quantityKg,
        quantityPcs,
        conversionRate: data.conversionRate,
        status: 'ACTIVE',
        qcStatus: 'A',
        operator: data.operator,
        createdAt: now(),
        updatedAt: now(),
      };
      list.push(item);
      results.push(item);

      AuditDB.write({
        batchId: item.batchId,
        productName: item.productName,
        transactionType: 'INBOUND',
        orderNo: data.orderNo,
        qtyBefore: 0,
        qtyChanged: qty,
        qtyAfter: qty,
        operator: data.operator,
        remark: `批次入庫: ${caseNo} (${qty}${data.unit})`,
      });
    });

    saveList(KEYS.INVENTORY, list);
    return results;
  },

  update: (batchId: string, data: Partial<Pick<InventoryBatch, 'shelfLocation' | 'batchNo' | 'receiveDate' | 'quantity' | 'operator'>>): InventoryBatch => {
    const list = InventoryDB.getAll();
    const idx = list.findIndex(i => i.batchId === batchId);
    if (idx === -1) throw new Error('庫存批次不存在');
    if (IssueDB.getByBatchId(batchId).length > 0 && data.quantity !== undefined)
      throw new Error('此批次已有領料記錄，無法修改入庫數量');
    list[idx] = { ...list[idx], ...data, updatedAt: now() };
    saveList(KEYS.INVENTORY, list);
    return list[idx];
  },

  delete: (batchId: string): void => {
    if (IssueDB.getByBatchId(batchId).length > 0)
      throw new Error('此批次已有領料記錄，不可刪除');
    saveList(KEYS.INVENTORY, InventoryDB.getAll().filter(i => i.batchId !== batchId));
    saveList(KEYS.AUDIT, AuditDB.getAll().filter(a => a.batchId !== batchId));
  },

  // ── 品質狀態變更 ──
  updateQCStatus: (batchId: string, qcStatus: string, remark: string, operator: string): void => {
    const list = InventoryDB.getAll();
    const idx = list.findIndex(i => i.batchId === batchId);
    if (idx === -1) throw new Error('庫存批次不存在');
    
    const oldStatus = list[idx].qcStatus || 'OK';
    list[idx] = { ...list[idx], qcStatus, qcRemark: remark, updatedAt: now() };
    saveList(KEYS.INVENTORY, list);

    AuditDB.write({
      batchId,
      productName: list[idx].productName,
      transactionType: 'ADJUST_ADD', // 借用 ADJUST_ADD 或另定義
      orderNo: list[idx].orderNo,
      qtyBefore: 0,
      qtyChanged: 0,
      qtyAfter: 0,
      operator,
      remark: `品質判定變更: [${oldStatus}] -> [${qcStatus}] | 原因: ${remark}`,
    });
  },

  // ── 品質狀態聯動更新 (溯源連動) ──
  updateQCStatusCascade: (
    batchId: string, 
    qcStatus: string, 
    remark: string, 
    operator: string,
    options: { upstream: boolean; downstream: boolean }
  ): void => {
    const allBatches = InventoryDB.getAll();
    const affectedIds = new Set<string>();

    const collectIds = (id: string, dir: 'UP' | 'DOWN' | 'BOTH') => {
      if (affectedIds.has(id)) return;
      affectedIds.add(id);

      if (dir === 'DOWN' || dir === 'BOTH') {
        allBatches.filter(b => b.parentBatchId === id).forEach(child => collectIds(child.batchId, 'DOWN'));
      }
      if (dir === 'UP' || dir === 'BOTH') {
        const current = allBatches.find(b => b.batchId === id);
        if (current?.parentBatchId) collectIds(current.parentBatchId, 'UP');
      }
    };

    const direction = options.upstream && options.downstream ? 'BOTH' : options.upstream ? 'UP' : options.downstream ? 'DOWN' : 'NONE';
    if (direction === 'NONE') {
      affectedIds.add(batchId);
    } else {
      collectIds(batchId, direction);
    }

    const list = InventoryDB.getAll();
    affectedIds.forEach(id => {
      const idx = list.findIndex(b => b.batchId === id);
      if (idx !== -1) {
        const oldStatus = list[idx].qcStatus || 'A';
        list[idx] = { ...list[idx], qcStatus, qcRemark: remark, updatedAt: now() };
        
        AuditDB.write({
          batchId: id,
          productName: list[idx].productName,
          transactionType: 'ADJUST_ADD',
          orderNo: list[idx].orderNo,
          qtyBefore: 0,
          qtyChanged: 0,
          qtyAfter: 0,
          operator,
          remark: `[聯動判定] 品質變更: [${oldStatus}] -> [${qcStatus}] | 原因: ${remark} (溯源聯動)`,
        });
      }
    });

    saveList(KEYS.INVENTORY, list);
  },

  getWithRemaining: (): InventoryWithRemaining[] => {
    const batches = InventoryDB.getAll();
    const issues = IssueDB.getAll();
    return batches.map(batch => {
      const batchIssues = issues.filter(i => i.batchId === batch.batchId);
      const usageQty = batchIssues.reduce((sum, i) => sum + i.usageQty, 0);
      const remainingQty = Math.max(0, batch.quantity - usageQty);
      const lastIssue = batchIssues.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      return {
        ...batch,
        usageQty,
        remainingQty,
        issueDate: lastIssue?.issueDate,
        status: remainingQty === 0 ? 'DEPLETED' as const : usageQty > 0 ? 'PARTIAL' as const : 'ACTIVE' as const,
      };
    });
  },

  getByProductFIFO: (productName: string): InventoryWithRemaining[] =>
    InventoryDB.getWithRemaining()
      .filter(i =>
        i.productName.toLowerCase().includes(productName.toLowerCase()) &&
        i.status !== 'DEPLETED' && i.status !== 'CANCELLED'
      )
      .sort((a, b) => new Date(a.receiveDate).getTime() - new Date(b.receiveDate).getTime()),

  getProductSummaries: (): ProductStockSummary[] => {
    const all = InventoryDB.getWithRemaining();
    const map = new Map<string, ProductStockSummary>();
    all.forEach(item => {
      const ex = map.get(item.productName);
      if (ex) {
        ex.totalQty += item.quantity;
        ex.totalUsed += item.usageQty;
        ex.totalRemaining += item.remainingQty;
        ex.batches.push(item);
      } else {
        map.set(item.productName, {
          productName: item.productName,
          totalQty: item.quantity,
          totalUsed: item.usageQty,
          totalRemaining: item.remainingQty,
          batches: [item],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  },
};

// ============================================================
// 領料/出庫 (Issue)
// ============================================================
export const IssueDB = {
  getAll: (): IssueRecord[] => getList<IssueRecord>(KEYS.ISSUES),

  getByBatchId: (batchId: string): IssueRecord[] =>
    IssueDB.getAll().filter(i => i.batchId === batchId),

  create: (data: {
    batchId: string;
    orderNo: string;
    usageQty: number;
    unit: Unit;
    operator: string;
    remark?: string;
  }): IssueRecord => {
    const batch = InventoryDB.getAll().find(b => b.batchId === data.batchId);
    if (!batch) throw new Error('庫存批次不存在');

    const bwr = InventoryDB.getWithRemaining().find(b => b.batchId === data.batchId);
    if (!bwr) throw new Error('批次計算失敗');
    if (data.usageQty > bwr.remainingQty)
      throw new Error(`領用量 (${data.usageQty}) 超過剩餘量 (${bwr.remainingQty})`);

    // 判斷出庫類型
    const prefix = data.orderNo.charAt(0).toUpperCase();
    const txType = prefix === 'B' ? 'OUTBOUND_OUTSOURCE' as const : 'OUTBOUND_PROCESS' as const;

    const record: IssueRecord = {
      issueId: genId(),
      batchId: data.batchId,
      caseNo: batch.caseNo,
      productName: batch.productName,
      warehouseCode: batch.warehouseCode,
      orderNo: data.orderNo,
      usageQty: data.usageQty,
      unit: data.unit,
      issueDate: today(),
      operator: data.operator,
      remark: data.remark ?? '',
      createdAt: now(),
    };

    saveList(KEYS.ISSUES, [...IssueDB.getAll(), record]);

    // Update batch status
    const newRemaining = bwr.remainingQty - data.usageQty;
    const list2 = InventoryDB.getAll();
    const idx = list2.findIndex(b => b.batchId === data.batchId);
    if (idx !== -1) {
      list2[idx].status = newRemaining <= 0 ? 'DEPLETED' : 'PARTIAL';
      list2[idx].updatedAt = now();
      saveList(KEYS.INVENTORY, list2);
    }

    AuditDB.write({
      batchId: data.batchId,
      productName: batch.productName,
      transactionType: txType,
      orderNo: data.orderNo,
      qtyBefore: bwr.remainingQty,
      qtyChanged: -data.usageQty,
      qtyAfter: newRemaining,
      operator: data.operator,
      remark: `出庫: ${record.issueId}`,
    });
    return record;
  },

  delete: (issueId: string): void => {
    const issues = IssueDB.getAll();
    const target = issues.find(i => i.issueId === issueId);
    if (!target) throw new Error('領料記錄不存在');
    const batchList = InventoryDB.getAll();
    const idx = batchList.findIndex(b => b.batchId === target.batchId);
    if (idx !== -1) {
      batchList[idx].status = 'PARTIAL';
      batchList[idx].updatedAt = now();
      saveList(KEYS.INVENTORY, batchList);
    }
    saveList(KEYS.ISSUES, issues.filter(i => i.issueId !== issueId));
    AuditDB.write({
      batchId: target.batchId,
      productName: target.productName,
      transactionType: 'ADJUST_ADD',
      orderNo: target.orderNo,
      qtyBefore: 0,
      qtyChanged: target.usageQty,
      qtyAfter: target.usageQty,
      operator: 'System',
      remark: `撤銷出庫: ${issueId}`,
    });
  },
};

// ============================================================
// 異動日誌 (Audit)
// ============================================================
export const AuditDB = {
  getAll: (): AuditLog[] => getList<AuditLog>(KEYS.AUDIT),

  write: (data: Omit<AuditLog, 'logId' | 'timestamp'>): AuditLog => {
    const list = AuditDB.getAll();
    const log: AuditLog = { ...data, logId: genId(), timestamp: now() };
    saveList(KEYS.AUDIT, [...list, log]);
    return log;
  },

  rollback: (logId: string, operator: string): string => {
    const logs = AuditDB.getAll();
    const target = logs.find(l => l.logId === logId);
    if (!target) throw new Error('找不到該筆異動紀錄');
    if (target.transactionType === 'ROLLBACK') throw new Error('該紀錄已經是退回操作');

    const inventory = InventoryDB.getAll();
    const batch = inventory.find(b => b.batchId === target.batchId);
    if (!batch) throw new Error('找不到對應的庫存批次，可能已被刪除');

    // 反向操作
    const reverseQty = -target.qtyChanged;
    const currentRemaining = InventoryDB.getWithRemaining().find(b => b.batchId === target.batchId)?.remainingQty || 0;

    // 退回入庫檢查
    if (reverseQty < 0 && currentRemaining < Math.abs(reverseQty)) {
      throw new Error(`庫存不足以退回！目前剩餘: ${currentRemaining}, 需扣除: ${Math.abs(reverseQty)}`);
    }

    // 更新批次主檔數量
    const idx = inventory.findIndex(b => b.batchId === target.batchId);
    inventory[idx].quantity += reverseQty;
    inventory[idx].status = inventory[idx].quantity <= 0 ? 'DEPLETED' : 'ACTIVE';
    inventory[idx].updatedAt = now();
    saveList(KEYS.INVENTORY, inventory);

    // 寫入退回紀錄
    AuditDB.write({
      batchId: target.batchId,
      productName: target.productName,
      transactionType: 'ROLLBACK',
      orderNo: target.orderNo,
      qtyBefore: currentRemaining,
      qtyChanged: reverseQty,
      qtyAfter: currentRemaining + reverseQty,
      operator,
      remark: `退回上一階: 針對紀錄 ${target.logId.slice(0,6)}`,
    });

    return '✓ 成功退回上一階！庫存已自動修正。';
  },
};
