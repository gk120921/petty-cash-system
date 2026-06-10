// ============================================================
// 產品標示卡 v2.2 — 支援連續列印 (一鍵列印多張)
// ============================================================

import React from 'react';
import type { InventoryBatch } from '../types';
import { Printer, X, ChevronDown } from 'lucide-react';

interface Props {
  items: InventoryBatch[]; // 改為接收陣列
  onClose: () => void;
}

export default function ProductCard({ items, onClose }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="print-overlay" onClick={onClose}>
      <div className="print-multi-container" onClick={e => e.stopPropagation()}>
        
        {/* ── 捲動預覽區 (畫面上看得到多張) ── */}
        <div className="print-scroll-area">
          {items.map((item, idx) => (
            <div key={item.batchId} className="kst-label-table-wrapper">
              <div className="kst-label-table">
                <div className="label-header">
                  <div className="logo-box">
                    <span className="kst-logo-text">KST</span>
                    <span className="kst-reg">®</span>
                  </div>
                  <div className="header-titles">
                    <div className="company-zh">健和興倉儲</div>
                    <div className="company-en">KST Warehouse</div>
                    <div className="main-title-zh">產品標示卡</div>
                    <div className="main-title-en">Product Identification Card</div>
                  </div>
                </div>

                <div className="label-body">
                  <div className="label-row">
                    <div className="label-cell head">單據編號<br />Document Number / Reference No.</div>
                    <div className="label-cell content td-mono">{item.orderNo}</div>
                  </div>
                  <div className="label-row">
                    <div className="label-cell head">收料日期<br />Date Received / Receiving Date</div>
                    <div className="label-cell content">{item.receiveDate}</div>
                  </div>
                  <div className="label-row">
                    <div className="label-cell head">產品名稱<br />Product Name / Item Description</div>
                    <div className="label-cell content td-bold">{item.productName}</div>
                  </div>
                  <div className="label-row">
                    <div className="label-cell head">數量<br />Quantity (Qty.)</div>
                    <div className="label-cell content">
                      <span className="qty-val">{item.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span> {item.unit.toUpperCase()}
                    </div>
                  </div>
                  <div className="label-row">
                    <div className="label-cell head">批號<br />Batch Number / Lot No.</div>
                    <div className="label-cell content td-mono">{item.batchNo}</div>
                  </div>
                  <div className="label-row">
                    <div className="label-cell head">儲位 / 箱號<br />Location / Case No.</div>
                    <div className="label-cell content td-mono" style={{ fontSize: '0.8rem' }}>
                      [{item.warehouseCode}-{item.shelfLocation}] {item.caseNo}
                    </div>
                  </div>
                  <div className="label-row">
                    <div className="label-cell head">作 業 者 :<br />Operator:</div>
                    <div className="label-cell content">{item.operator}</div>
                  </div>
                </div>
              </div>
              <div className="label-page-indicator">第 {idx + 1} 頁 / 共 {items.length} 頁</div>
            </div>
          ))}
        </div>

        {/* ── 懸浮控制按鈕 ── */}
        <div className="print-controls-fixed">
          <div className="print-info">
            <Printer size={18} />
            <span>準備列印 <strong>{items.length}</strong> 張標示卡</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={onClose}><X size={16} /> 關閉</button>
            <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> 全部列印 (Continuous)</button>
          </div>
        </div>

      </div>
    </div>
  );
}
