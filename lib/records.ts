export const projectRecord: Record<number, any> = {};
export const activeProjectRecord: Record<number, number> = {};
export const activeLinkRecord: Record<number, number> = {};
export const transferProjectRecord: Record<number, { projectId: number; fromUserId: number }> = {};

export const lastTransferRequestRecord: Record<number, { timestamp: number, fromUserId: number }> = {};

export const projectMessageIdRecord: Record<number, number> = {};

export const isInConversationRecord: Record<number, boolean> = new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop in target) {
          return (target as any)[prop];
        }
        return false;
      }
    }
  ) as Record<number, boolean>;
  