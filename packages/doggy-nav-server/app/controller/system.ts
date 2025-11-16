import CommonController from '../core/base_controller';

export default class SystemController extends CommonController {
  public async version() {
    const { app } = this;
    const info = app.systemVersion || {
      currentCommitId: null,
      currentCommitTime: null,
      latestCommitId: null,
      latestCommitTime: null,
      hasNewVersion: false,
      checkedAt: null,
    };

    this.success(info);
  }
}
