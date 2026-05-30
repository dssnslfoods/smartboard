import type { TableMeta } from '@/types'

/**
 * Smartcare Complaint Hub — real-data snapshot.
 *
 * Pulled read-only via MCP from Supabase project adynnacxcnzlcrcqrqge on
 * 2026-05-30. This project has public API disabled (anon key gets 401 even
 * though the key is correct) so snapshot is the only option.
 *
 * 759 complaints, 6 branches, 5 categories, 10 problem types, 6 root causes.
 */

export const SMARTCARE_SOURCE_ID = 'smartcare-snapshot'
export const SMARTCARE_META = {
  id: SMARTCARE_SOURCE_ID,
  name: 'Smartcare',
  color: '#F85149',
  capturedAt: '2026-05-30',
  description: 'Complaint management · captured 2026-05-30',
}

type Row = Record<string, unknown>

export const SMARTCARE_TABLES: Record<string, Row[]> = {
  sc_kpi: [
    {
      total_complaints: 759,
      open_complaints: 84,   // Call ขาเข้า + คาดปิด/ไม่ปิด
      closed_complaints: 675,
      avg_resolve_days: null, // resolved_at data incomplete
      categories: 5,
      branches: 6,
      problem_types: 10,
    },
  ],

  sc_status: [
    { status: 'ไม่ปิดผู้ผลิต', count: 356 },
    { status: 'ปิดผู้ผลิต', count: 315 },
    { status: 'Call ขาเข้า', count: 80 },
    { status: 'คาดไม่ปิดผู้ผลิต', count: 4 },
    { status: 'ปิดเป็น RD', count: 3 },
    { status: 'คาดปิดผู้ผลิต', count: 1 },
  ],

  sc_priority: [
    { priority: 'Medium', count: 423 },
    { priority: 'Low', count: 226 },
    { priority: 'High', count: 110 },
  ],

  sc_category: [
    { category: 'Food Quality', count: 543 },
    { category: 'Food Safety', count: 115 },
    { category: 'Service', count: 85 },
    { category: 'Food Law', count: 16 },
  ],

  sc_problem_type: [
    { problem_type: 'FQY_ด้านสิ่งแปลกปลอม', count: 336 },
    { problem_type: 'FQY_ด้านคุณภาพสินค้า', count: 207 },
    { problem_type: 'FST_ด้านจุลินทรีย์', count: 86 },
    { problem_type: 'SVC_ด้านการขนส่ง', count: 85 },
    { problem_type: 'FST_ด้านสิ่งแปลกปลอม', count: 29 },
    { problem_type: 'FLW_ด้านบรรจุภัณฑ์', count: 16 },
  ],

  sc_monthly: [
    { month: '2026-04', count: 127 },
    { month: '2026-05', count: 632 },
  ],

  sc_branch: [
    { branch: 'Branch 2', count: 506 },
    { branch: 'Branch 1', count: 246 },
    { branch: 'Branch 3', count: 6 },
  ],

  sc_product_group: [
    { product_group: 'PMA07', count: 265 },
    { product_group: 'PMA03', count: 209 },
    { product_group: 'PMA01', count: 66 },
    { product_group: 'PMA08', count: 58 },
    { product_group: 'PMA02', count: 43 },
    { product_group: 'CDC นครสวรรค์', count: 28 },
    { product_group: 'CDC นครราชสีมา', count: 18 },
    { product_group: 'CDC ขอนแก่น', count: 14 },
    { product_group: 'CDC ชลบุรี', count: 11 },
    { product_group: 'BAW', count: 8 },
  ],

  sc_root_cause: [
    { root_cause: 'Man (คน)', count: 344 },
    { root_cause: 'NA', count: 260 },
    { root_cause: 'Method (วิธีการทำงาน)', count: 78 },
    { root_cause: 'Material (วัตถุดิบ)', count: 57 },
    { root_cause: 'Machine (เครื่องจักร)', count: 15 },
    { root_cause: 'Environment (สภาพแวดล้อม)', count: 5 },
  ],
}

export const SMARTCARE_CATALOG: TableMeta[] = [
  { name: 'sc_kpi', description: 'Complaint KPIs (single row)', columns: [
    { name: 'total_complaints', role: 'metric' },
    { name: 'open_complaints', role: 'metric' },
    { name: 'closed_complaints', role: 'metric' },
    { name: 'categories', role: 'metric' },
    { name: 'branches', role: 'metric' },
  ] },
  { name: 'sc_status', description: 'Complaints by status', columns: [
    { name: 'status', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_priority', description: 'Complaints by priority', columns: [
    { name: 'priority', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_category', description: 'Complaints by category (Food Quality / Safety / Service / Law)', columns: [
    { name: 'category', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_problem_type', description: 'Complaints by problem type', columns: [
    { name: 'problem_type', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_monthly', description: 'Complaints per month', columns: [
    { name: 'month', role: 'date' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_branch', description: 'Complaints by branch', columns: [
    { name: 'branch', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_product_group', description: 'Complaints by product group', columns: [
    { name: 'product_group', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
  { name: 'sc_root_cause', description: 'Complaints by root cause (5M1E)', columns: [
    { name: 'root_cause', role: 'dimension' }, { name: 'count', role: 'metric' },
  ] },
]
