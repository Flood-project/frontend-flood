import { instance } from '../../../../services/axios';
import type { AuditLog } from '../../domain/admin/audit';

export const fetchLogs = async (): Promise<AuditLog[]> => {
    const response = await instance.get<AuditLog[]>('/logs');
    return response.data
}