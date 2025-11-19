// import type { AuditLog } from '../../domain/admin/audit';
// import { supabase } from '../supabase';

// export async function getAuditLogs(filters?: {
//   table_name?: string;
//   user_id?: string;
//   operation?: string;
//   limit?: number;
// }) {
//   let query = supabase
//     .from('audit_logs')
//     .select('*')
//     .order('created_at', { ascending: false });

//   if (filters?.table_name) {
//     query = query.eq('table_name', filters.table_name);
//   }

//   if (filters?.user_id) {
//     query = query.eq('user_id', filters.user_id);
//   }

//   if (filters?.operation) {
//     query = query.eq('operation', filters.operation);
//   }

//   if (filters?.limit) {
//     query = query.limit(filters.limit);
//   }

//   const { data, error } = await query;

//   if (error) throw error;
//   return data as AuditLog[];
// }