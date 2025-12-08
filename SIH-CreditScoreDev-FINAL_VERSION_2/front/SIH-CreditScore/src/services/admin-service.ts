import { fetchFromApi } from '@/lib/api';

export interface AdminStats {
    totalUsers: number;
    beneficiaries: number;
    loanOfficers: number;
    admins: number;
}

export interface UserDetails {
    userId: number;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    preferredLanguage: string;
    createdAt: string;
}

export interface UserSearchFilters {
    role?: string;
    isActive?: boolean;
    regionType?: string;
    state?: string;
    district?: string;
    casteCategory?: string;
    gender?: string;
    registeredAfter?: string;
    registeredBefore?: string;
    searchText?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
}

export interface UserSearchResult {
    userId: number;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    isBlacklisted: boolean;
    preferredLanguage: string;
    createdAt: string;
    fullName?: string;
    state?: string;
    district?: string;
    regionType?: string;
    casteCategory?: string;
    gender?: string;
}

export interface UserSearchResponse {
    users: UserSearchResult[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    appliedFilters: UserSearchFilters;
}

export const adminService = {
    async getStats(): Promise<AdminStats> {
        return await fetchFromApi('/admin/stats');
    },

    async searchUser(email: string): Promise<UserDetails> {
        return await fetchFromApi(`/admin/users/search?email=${encodeURIComponent(email)}`);
    },

    async updateUserRole(email: string, role: string): Promise<UserDetails> {
        return await fetchFromApi('/admin/users/role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ email, role }).toString(),
        });
    },

    async updateUserRoleById(userId: number, role: string): Promise<UserDetails> {
        return await fetchFromApi(`/admin/users/${userId}/role`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ role }).toString(),
        });
    },

    async advancedUserSearch(filters: UserSearchFilters): Promise<UserSearchResponse> {
        return await fetchFromApi('/admin/users/search/advanced', {
            method: 'POST',
            body: JSON.stringify(filters),
        });
    },

    async toggleUserStatus(userId: number): Promise<UserDetails> {
        return await fetchFromApi(`/admin/users/${userId}/toggle-status`, {
            method: 'POST',
        });
    },

    async blockUser(userId: number): Promise<UserDetails> {
        return await fetchFromApi(`/admin/users/${userId}/block`, {
            method: 'POST',
        });
    },

    async unblockUser(userId: number): Promise<UserDetails> {
        return await fetchFromApi(`/admin/users/${userId}/unblock`, {
            method: 'POST',
        });
    },
};
