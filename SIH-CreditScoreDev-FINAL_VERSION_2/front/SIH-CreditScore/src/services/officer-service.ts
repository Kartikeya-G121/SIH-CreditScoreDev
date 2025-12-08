
import { fetchFromApi } from '@/lib/api';

export interface ReviewRequest {
    approved: boolean;
    comments: string;
}

export interface SanctionRequest {
    amount: number;
    interestRate: number;
}

export const officerService = {
    async getApplications(page = 0, size = 10): Promise<any> {
        return await fetchFromApi(`/officer/applications?page=${page}&size=${size}`);
    },

    async reviewApplication(id: number, data: ReviewRequest): Promise<any> {
        return await fetchFromApi(`/officer/application/${id}/review`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async sanctionApplication(id: number, data: SanctionRequest): Promise<any> {
        return await fetchFromApi(`/officer/application/${id}/sanction`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
