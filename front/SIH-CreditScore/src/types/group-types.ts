export interface GroupResponse {
    groupId: number;
    groupName: string;
    formationDate: string;
    projectDescription: string;
    createdByUserId: number;
    leaderName: string;
    groupScore: number;
    isActive: boolean;
    memberCount: number;
    maxMembers: number;
    members: MemberResponse[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroupRequest {
    groupName: string;
    formationDate?: string;
    projectDescription: string;
}

export interface UpdateGroupRequest {
    groupName?: string;
    formationDate?: string;
    projectDescription?: string;
}

export interface GroupListResponse {
    groups: GroupResponse[];
    total: number;
}

export interface MemberResponse {
    memberId: number;
    userId: number;
    userName: string;
    email: string;
    phoneNumber: string;
    role: 'LEADER' | 'MEMBER';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    joinedAt: string;
}

export interface MemberListResponse {
    members: MemberResponse[];
    total: number;
}

export interface StatusResponse {
    success: boolean;
    message: string;
}
