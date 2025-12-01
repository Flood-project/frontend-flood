export interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  operation: string; // INSERT | UPDATE | DELETE — mas backend não garante
  user_id: number;   // você está dando COALESCE(..., 0)
  user_email: string;
  old_data: string;
  new_data: string;
  changed_fields: string [];
  ip_address: string;
  user_agent: string;
  created_at: string;
}