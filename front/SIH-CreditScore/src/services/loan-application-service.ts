import { fetchFromApi } from '@/lib/api';
import type { ConsentData, ApplicationStatus, LoanType, LoanApplicationRequest, ApplicationResponse, GroupApplicationStatus, GroupApplicationStatusResponse, ReviewRequest, SanctionRequest, TimelineResponse } from '@/types/loan-application-types';
import type { GroupResponse } from '@/types/group-types';

export const loanApplicationService = {
    /**
     * Check if user has an existing loan application
     * @param groupId - Optional group ID to check for group-specific application
     */
    async checkExistingApplication(groupId?: number): Promise<ApplicationStatus> {
        try {
            // TODO: Replace with actual backend endpoint when available
            // For now, return mock data
            const params = groupId ? `?groupId=${groupId}` : '';
            // const response = await fetchFromApi(`/loans/check-application${params}`);

            // Mock response - replace with actual API call
            return {
                hasActiveApplication: false,
                applicationId: undefined,
                status: undefined,
                groupId: groupId,
            };
        } catch (error) {
            console.error('Failed to check existing application:', error);
            throw error;
        }
    },

    /**
     * Get user's groups for group loan selection
     */
    async getUserGroups(): Promise<GroupResponse[]> {
        try {
            console.log('Fetching user groups...');
            const response = await fetchFromApi('/groups/my-groups');
            console.log('User groups response:', response);

            // Handle different response structures
            if (Array.isArray(response)) {
                return response;
            } else if (response.groups && Array.isArray(response.groups)) {
                return response.groups;
            }

            console.warn('Unexpected group response structure:', response);
            return [];
        } catch (error) {
            console.error('Failed to fetch user groups:', error);
            throw error;
        }
    },

    /**
     * Get group details by ID
     */
    async getGroupById(groupId: number): Promise<GroupResponse> {
        try {
            return await fetchFromApi(`/groups/${groupId}`);
        } catch (error) {
            console.error('Failed to fetch group details:', error);
            throw error;
        }
    },

    /**
     * Get application status for a specific group
     */
    /**
     * Get application status for a specific group
     */
    async getGroupApplicationStatus(groupId: number): Promise<GroupApplicationStatus> {
        try {
            // 1. Fetch Group Details for header info
            const group = await this.getGroupById(groupId);

            // 2. Fetch Group Status from API (The "War Room" endpoint)
            const memberStatuses: GroupApplicationStatusResponse[] = await fetchFromApi(`/applications/group/${groupId}/status`);

            // 3. Map API response to UI model
            const members = memberStatuses.map(ms => ({
                userId: ms.userId,
                userName: ms.userName,
                role: ms.role,
                status: (ms.status === 'NOT_APPLIED' ? 'NOT_STARTED' : ms.status) as 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED',
                applicationId: ms.applicationId || undefined,
                // We don't get amount in status response, but we could fetch it if needed.
                // For the dashboard list, status is most important.
            }));

            // 4. Check if can submit (Leader only, all members must be DRAFT)
            // Note: The backend might enforce this, but we can also check here for UI state.
            // "The Leader can ONLY submit when EVERYONE is in DRAFT status."
            const allMembersDraft = members.every(m => m.status === 'DRAFT');

            return {
                groupId,
                groupName: group.groupName,
                leaderName: group.leaderName,
                canSubmit: allMembersDraft,
                members
            };
        } catch (error) {
            console.error('Failed to get group application status:', error);
            throw error;
        }
    },

    /**
     * Submit group application (Leader only)
     */
    async submitGroupApplication(groupId: number): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/group/${groupId}/submit`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Failed to submit group application:', error);
            throw error;
        }
    },


    /**
     * Submit loan consent
     */
    async submitLoanConsent(data: ConsentData): Promise<void> {
        try {
            // TODO: Replace with actual backend endpoint when available
            // await fetchFromApi('/loans/consent', {
            //   method: 'POST',
            //   body: JSON.stringify(data),
            // });

            // For now, just log the consent
            console.log('Loan consent submitted:', data);

            // Store consent in localStorage as temporary solution
            const consents = JSON.parse(localStorage.getItem('loan-consents') || '[]');
            consents.push(data);
            localStorage.setItem('loan-consents', JSON.stringify(consents));
        } catch (error) {
            console.error('Failed to submit loan consent:', error);
            throw error;
        }
    },

    /**
     * Create a draft loan application
     */
    async createDraftApplication(data: LoanApplicationRequest): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi('/applications', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Failed to create draft application:', error);
            throw error;
        }
    },

    /**
     * Update an existing draft application
     */
    async updateDraftApplication(applicationId: number, data: LoanApplicationRequest): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error('Failed to update draft application:', error);
            throw error;
        }
    },

    /**
     * Submit a draft application for processing
     */
    async submitApplication(applicationId: number): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}/submit`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Failed to submit application:', error);
            throw error;
        }
    },

    /**
     * Get application by ID
     */
    async getApplicationById(applicationId: number): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}`);
        } catch (error) {
            console.error('Failed to fetch application:', error);
            throw error;
        }
    },

    /**
     * Get all applications for the current user
     */
    async getMyApplications(): Promise<ApplicationResponse[]> {
        try {
            const response = await fetchFromApi('/applications');
            return response || [];
        } catch (error) {
            console.error('Failed to fetch applications:', error);
            throw error;
        }
    },

    /**
     * Withdraw an application
     */
    async withdrawApplication(applicationId: number): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}/withdraw`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Failed to withdraw application:', error);
            throw error;
        }
    },

    /**
     * Get application timeline
     */
    async getApplicationTimeline(applicationId: number): Promise<TimelineResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}/timeline`);
        } catch (error) {
            console.error('Failed to fetch application timeline:', error);
            throw error;
        }
    },

    // ==================== Admin/Officer Methods ====================

    /**
     * Get pending applications (Officer/Admin only)
     */
    async getPendingApplications(): Promise<ApplicationResponse[]> {
        try {
            return await fetchFromApi('/applications/officer/pending');
        } catch (error) {
            console.error('Failed to fetch pending applications:', error);
            throw error;
        }
    },

    /**
     * Review an application (Officer/Admin only)
     */
    async reviewApplication(
        applicationId: number,
        request: ReviewRequest
    ): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}/review`, {
                method: 'PUT',
                body: JSON.stringify(request),
            });
        } catch (error) {
            console.error('Failed to review application:', error);
            throw error;
        }
    },

    /**
     * Sanction an application (Officer/Admin only)
     */
    async sanctionApplication(
        applicationId: number,
        request: SanctionRequest
    ): Promise<ApplicationResponse> {
        try {
            return await fetchFromApi(`/applications/${applicationId}/sanction`, {
                method: 'POST',
                body: JSON.stringify(request),
            });
        } catch (error) {
            console.error('Failed to sanction application:', error);
            throw error;
        }
    },
};

