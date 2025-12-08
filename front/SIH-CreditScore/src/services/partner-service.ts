
import { fetchFromApi } from '@/lib/api';
import { Scheme } from './scheme-service';

export interface OfficerCreateRequest {
    name: string;
    email: string;
}

export interface PartnerRequestDTO {
    gmailForLogin: string;
    officialOrganizationEmail: string;
    contactPersonName: string;
    mobile?: string;
    note?: string;
}

export const partnerService = {
    async createOnboardingRequest(data: PartnerRequestDTO): Promise<any> {
        return await fetchFromApi('/auth/partner/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async createScheme(data: Partial<Scheme>): Promise<any> {
        return await fetchFromApi('/partner/schemes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async createOfficer(data: OfficerCreateRequest): Promise<any> {
        return await fetchFromApi('/partner/officers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getApplications(page = 0, size = 10): Promise<any> {
        return await fetchFromApi(`/partner/applications?page=${page}&size=${size}`);
    }
};
