// ============================================================
// WMS v2.0 — 核心型別定義
// 規則: 所有 interface import 必須使用 import type
// ============================================================

// ── 入庫分類 ────────────────────────────────────────────────
export type InboundCategory = 'RAW' | 'SEMI' | 'FINISHED';

// ── 單號前綴 ────────────────────────────────────────────────
// A = 採購單號, B = 托工單號, C = 製程製令
export type OrderPrefix = 'A' | 'B' | 'C';

// ── 基礎列舉 ────────────────────────────────────────────────
export type Unit = 'pcs' | 'kg' | 'g' | 'm' | 'set';

export type TransactionType =
  | 'INBOUND'
  | 'OUTBOUND_PROCESS'   // 製程出庫 (C)
  | 'OUTBOUND_OUTSOURCE' // 委外出庫 (B)
  | 'ADJUST_ADD'
  | 'ADJUST_SUB'
  | 'TRANSFER'
  | 'ROLLBACK';

export type InventoryStatus = 'ACTIVE' | 'PARTIAL' | 'DEPLETED' | 'CANCELLED';

// ── 儲位分類 ────────────────────────────────────────────────
export type WarehouseCategory = 'NORMAL' | 'SUB' | 'PROCESS';

// ── 儲位主檔 ────────────────────────────────────────────────
export interface StorageLocation {
  locationId: string;       // UUID
  warehouseCode: string;    // e.g. WS001
  warehouseCategory: WarehouseCategory; // 新增分類
  shelfLocation: string;    // e.g. A01
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── 產品主檔 (BOM 換算用) ───────────────────────────────────
export interface Product {
  productId: string;
  productName: string;
  spec: string;
  baseUnit: Unit;
  altUnit: Unit;
  conversionRate: number;   // 1 pcs = ? kg (最小位數到六位數)
  parentProductName?: string; // 上游產品/原料
  defaultLocation?: string;   // 對應製程倉庫/儲位
  createdAt: string;
  updatedAt: string;
}

// ── 庫存批次主檔 ────────────────────────────────────────────
export interface InventoryBatch {
  batchId: string;
  caseNo: string;            // 箱號: 儲位+日期+流水編號
  category: InboundCategory; // 原料/半成品/成品
  orderNo: string;           // 單號 (A/B/C 開頭)
  warehouseCode: string;
  shelfLocation: string;
  productName: string;
  batchNo: string;
  receiveDate: string;
  quantity: number;
  unit: Unit;
  quantityKg?: number;
  quantityPcs?: number;
  conversionRate?: number;
  status: InventoryStatus;
  qcStatus?: string;         // 品質狀態: OK, NG, HOLD, WAIT...
  qcRemark?: string;         // 品檢備註
  operator: string;
  createdAt: string;
  updatedAt: string;
}

// ── 領料/出庫明細 ───────────────────────────────────────────
export interface IssueRecord {
  issueId: string;
  batchId: string;
  caseNo: string;
  productName: string;
  warehouseCode: string;
  orderNo: string;           // 關聯單號 (B/C 開頭)
  usageQty: number;
  unit: Unit;
  issueDate: string;
  operator: string;
  remark: string;
  createdAt: string;
}

// ── 衍生計算型別 ────────────────────────────────────────────
export interface InventoryWithRemaining extends InventoryBatch {
  usageQty: number;
  remainingQty: number;
  issueDate?: string;
}

export interface ProductStockSummary {
  productName: string;
  totalQty: number;
  totalUsed: number;
  totalRemaining: number;
  batches: InventoryWithRemaining[];
}

// ── 品質狀態主檔 ────────────────────────────────────────────
export interface QCStatus {
  code: string;          // e.g. OK, NG, HOLD
  name: string;          // e.g. 合格, 不合格, 暫扣
  nameEn: string;        // e.g. Pass, Reject, Hold
  color: string;         // CSS 顏色或 Hex
  canOutbound: boolean;  // 允許出庫
  canProduce: boolean;   // 允許生產
  restrictedCustomers: string; // 管制出給特定客戶 (逗號隔開)
  prohibitedCustomers: string; // 禁出給特定客戶 (逗號隔開)
  description: string;
  isActive: boolean;
}

// ── 異動日誌 ────────────────────────────────────────────────
export interface AuditLog {
  logId: string;
  batchId: string;
  productName: string; // 新增：記錄當時異動的品名
  transactionType: TransactionType;
  orderNo: string;
  qtyBefore: number;
  qtyChanged: number;
  qtyAfter: number;
  operator: string;
  remark: string;
  timestamp: string;
}
