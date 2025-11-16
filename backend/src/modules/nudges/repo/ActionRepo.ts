export class ActionRepo {
  private actions: any[] = [];

  async create(action: { nudgeId: string; userId: string; type: string }) {
    this.actions.push({ ...action, createdAt: new Date() });
    return action;
  }

  async list(userId: string) {
    return this.actions.filter(a => a.userId === userId);
  }
}
