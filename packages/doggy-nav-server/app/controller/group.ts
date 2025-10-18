import Controller from '../core/base_controller';

export default class GroupController extends Controller {
  tableName(): string { return 'Group'; }

  async edit() {
    await super.update();
  }

  async del() {
    await super.remove();
  }
}
