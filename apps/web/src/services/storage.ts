// LocalStorage service for Bodies of Work
import type {
  BodyOfWork,
  CreateBodyOfWorkInput,
  WorkflowState,
} from '../types';

const STORAGE_KEY = 'apdevflow_bodies_of_work';

export class StorageService {
  private static generateId(): string {
    return `bow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getAllBodiesOfWork(): BodyOfWork[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  static getBodyOfWorkById(id: string): BodyOfWork | null {
    const all = this.getAllBodiesOfWork();
    return all.find((bow) => bow.id === id) || null;
  }

  static createBodyOfWork(input: CreateBodyOfWorkInput): BodyOfWork {
    const now = new Date().toISOString();
    const newBodyOfWork: BodyOfWork = {
      id: this.generateId(),
      ...input,
      workflowState: 'Draft',
      createdAt: now,
      updatedAt: now,
    };

    const all = this.getAllBodiesOfWork();
    all.push(newBodyOfWork);
    this.saveBodiesOfWork(all);

    return newBodyOfWork;
  }

  static updateBodyOfWork(
    id: string,
    updates: Partial<Omit<BodyOfWork, 'id' | 'createdAt'>>
  ): BodyOfWork | null {
    const all = this.getAllBodiesOfWork();
    const index = all.findIndex((bow) => bow.id === id);

    if (index === -1) return null;

    const updated: BodyOfWork = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    this.saveBodiesOfWork(all);

    return updated;
  }

  static updateWorkflowState(
    id: string,
    state: WorkflowState
  ): BodyOfWork | null {
    return this.updateBodyOfWork(id, { workflowState: state });
  }

  static deleteBodyOfWork(id: string): boolean {
    const all = this.getAllBodiesOfWork();
    const filtered = all.filter((bow) => bow.id !== id);

    if (filtered.length === all.length) return false;

    this.saveBodiesOfWork(filtered);
    return true;
  }

  private static saveBodiesOfWork(bodies: BodyOfWork[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bodies));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  // For future Turso Cloud integration
  static async syncToCloud(): Promise<void> {
    // Placeholder for future cloud sync
    console.log('Cloud sync not yet implemented');
  }
}
