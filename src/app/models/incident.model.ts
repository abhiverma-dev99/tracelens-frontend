export interface Incident {
  id: string;
  message: string;
  service: string;
  stackTrace?: string;
  status: string;
  createdAt: string;
  projectId: string;
  aiRootCause?: string; 
  aiSolution?: string;
}