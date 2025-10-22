declare namespace Group {
    interface GroupItem {
        _id: string;
        name: string;
        displayName: string;
        slug: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
    }

    interface CreateGroupRequest {
        name: string;
        displayName: string;
        slug: string;
        description?: string;
    }

    interface UpdateGroupRequest extends Partial<CreateGroupRequest> {
        _id: string;
    }

    interface GroupListResponse {
        list: GroupItem[];
        total: number;
        success: boolean;
    }

    interface GroupResponse {
        data: GroupItem;
        success: boolean;
    }
}