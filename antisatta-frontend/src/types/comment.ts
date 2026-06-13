export interface Comment {
  id: string;
  marketId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
  replies?: Comment[];
  isLiked?: boolean;
}

export interface CreateCommentInput {
  marketId: string;
  content: string;
  parentId?: string;
}
