// Group Lending API Service Layer
// Centralized service for group lending functionality

import { fetchFromApi } from '@/lib/api';
import type {
    GroupResponse,
    CreateGroupRequest,
    UpdateGroupRequest,
    MemberResponse,
    GroupListResponse,
    MemberListResponse,
    StatusResponse,
} from '@/types/group-types';

export const groupService = {
    /**
     * Create new borrower group
     * POST /api/v1/groups
     */
    async createGroup(data: CreateGroupRequest): Promise<GroupResponse> {
        const response = await fetchFromApi('/groups', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * List all groups
     * GET /api/v1/groups
     */
    async getAllGroups(): Promise<GroupListResponse> {
        const response = await fetchFromApi('/groups');
        // Handle both array and object response formats for backward compatibility
        if (Array.isArray(response.data)) {
            return { groups: response.data, total: response.data.length };
        }
        return response.data;
    },

    /**
     * List my groups
     * GET /api/v1/groups/my-groups
     */
    async getMyGroups(): Promise<GroupListResponse> {
        const response = await fetchFromApi('/groups/my-groups');
        if (Array.isArray(response.data)) {
            return { groups: response.data, total: response.data.length };
        }
        return response.data;
    },

    /**
     * Get group details by ID
     * GET /api/v1/groups/{id}
     */
    async getGroupById(id: number): Promise<GroupResponse> {
        const response = await fetchFromApi(`/groups/${id}`);
        return response.data;
    },

    /**
     * Update group details
     * PUT /api/v1/groups/{id}
     */
    async updateGroup(id: number, data: UpdateGroupRequest): Promise<GroupResponse> {
        const response = await fetchFromApi(`/groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    /**
     * Disband group (Leader only)
     * DELETE /api/v1/groups/{id}
     */
    async disbandGroup(id: number): Promise<StatusResponse> {
        const response = await fetchFromApi(`/groups/${id}`, {
            method: 'DELETE',
        });
        return response.data || { success: true, message: 'Group disbanded successfully' };
    },

    /**
     * Request to join group
     * POST /api/v1/groups/{id}/join
     */
    async joinGroup(id: number): Promise<MemberResponse> {
        const response = await fetchFromApi(`/groups/${id}/join`, {
            method: 'POST',
        });
        return response.data;
    },

    /**
     * Leave group
     * POST /api/v1/groups/{id}/leave
     */
    async leaveGroup(id: number): Promise<StatusResponse> {
        const response = await fetchFromApi(`/groups/${id}/leave`, {
            method: 'POST',
        });
        return response.data || { success: true, message: 'Left group successfully' };
    },

    /**
     * List group members
     * GET /api/v1/groups/{id}/members
     */
    async getGroupMembers(id: number): Promise<MemberListResponse> {
        const response = await fetchFromApi(`/groups/${id}/members`);
        if (Array.isArray(response.data)) {
            return { members: response.data, total: response.data.length };
        }
        return response.data;
    },

    /**
     * Approve member (Leader only)
     * PUT /api/v1/groups/{id}/members/{userId}/approve
     */
    async approveMember(groupId: number, userId: number): Promise<MemberResponse> {
        const response = await fetchFromApi(`/groups/${groupId}/members/${userId}/approve`, {
            method: 'PUT',
        });
        return response.data;
    },

    /**
     * Approve all pending members (Leader only)
     * PUT /api/v1/groups/{id}/members/approve-all
     */
    async approveAllMembers(groupId: number): Promise<MemberResponse[]> {
        const response = await fetchFromApi(`/groups/${groupId}/members/approve-all`, {
            method: 'PUT',
        });
        return response.data;
    },

    /**
     * Remove member from group (Leader only)
     * DELETE /api/v1/groups/{id}/members/{userId}
     */
    async removeMember(groupId: number, userId: number): Promise<StatusResponse> {
        const response = await fetchFromApi(`/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
        });
        return response.data || { success: true, message: 'Member removed successfully' };
    },
};
