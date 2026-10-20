import { Server } from 'socket.io';

let ioInstance: Server | null = null;
let syncLegacyComplaintHandler: ((complaint: any) => void) | null = null;

export function setSocketServer(io: Server) {
  ioInstance = io;
}

export function getSocketServer(): Server | null {
  return ioInstance;
}

let userCascadeHandler: ((oldUser: any, newUser: any) => void) | null = null;

export function registerLegacyComplaintSync(handler: (complaint: any) => void) {
  syncLegacyComplaintHandler = handler;
}

export function registerUserCascadeHandler(handler: (oldUser: any, newUser: any) => void) {
  userCascadeHandler = handler;
}

export function cascadeUserUpdates(oldUser: any, newUser: any) {
  if (userCascadeHandler) {
    try {
      userCascadeHandler(oldUser, newUser);
    } catch (err) {
      console.error('[EVENTS] Error cascading user updates:', err);
    }
  }
}

export function syncToLegacyComplaints(complaint: any) {
  if (syncLegacyComplaintHandler) {
    try {
      syncLegacyComplaintHandler(complaint);
    } catch (err) {
      console.error('[EVENTS] Error syncing legacy complaint:', err);
    }
  }
}

export function broadcastEvent(event: string, payload: any) {
  if (ioInstance) {
    try {
      ioInstance.emit(event, payload);
    } catch (err) {
      console.error(`[EVENTS] Error broadcasting event ${event}:`, err);
    }
  }
}

