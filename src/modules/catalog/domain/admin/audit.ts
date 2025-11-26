export interface AuditLog {
  id: number;
  table_name: string;
  operation: string; // INSERT | UPDATE | DELETE — mas backend não garante
  user_id: number;   // você está dando COALESCE(..., 0)
  user_email: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}