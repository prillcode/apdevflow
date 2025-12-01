// LocalStorage service for Items of DevWork
import type {
  DevWork,
  CreateDevWorkInput,
  WorkflowState,
} from '../types';

const STORAGE_KEY = 'apdevflow_dev_work';

export class StorageService {
  private static generateId(): string {
    return `bow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getAllDevWork(): DevWork[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  static getDevWorkById(id: string): DevWork | null {
    const all = this.getAllDevWork();
    return all.find((bow) => bow.id === id) || null;
  }

  static createDevWork(input: CreateDevWorkInput): DevWork {
    const now = new Date().toISOString();
    const newDevWork: DevWork = {
      id: this.generateId(),
      ...input,
      workflowState: 'Draft',
      createdAt: now,
      updatedAt: now,
    };

    const all = this.getAllDevWork();
    all.push(newDevWork);
    this.saveDevWork(all);

    return newDevWork;
  }

  static updateDevWork(
    id: string,
    updates: Partial<Omit<DevWork, 'id' | 'createdAt'>>
  ): DevWork | null {
    const all = this.getAllDevWork();
    const index = all.findIndex((bow) => bow.id === id);

    if (index === -1) return null;

    const updated: DevWork = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    this.saveDevWork(all);

    return updated;
  }

  static updateWorkflowState(
    id: string,
    state: WorkflowState
  ): DevWork | null {
    return this.updateDevWork(id, { workflowState: state });
  }

  static deleteDevWork(id: string): boolean {
    const all = this.getAllDevWork();
    const filtered = all.filter((bow) => bow.id !== id);

    if (filtered.length === all.length) return false;

    this.saveDevWork(filtered);
    return true;
  }

  private static saveDevWork(devwork: DevWork[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(devwork));
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
