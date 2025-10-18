import Controller from '../core/base_controller';

export default class RoleController extends Controller {
  tableName(): string { return 'Role'; }

  async edit() {
    await super.update();
  }

  async del() {
    await super.remove();
  }
}
