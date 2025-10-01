import { Service } from 'egg';
import { globalRootCategoryId } from '../../constants';

export default class CategoryService extends Service {
  formatCategoryList(data) {
    // Get first-stage categories (those with categoryId === globalRootCategoryId)
    const stairCategoryList = data.filter(item => item.categoryId === globalRootCategoryId);
    const newData = stairCategoryList.map(item => this.format({ ...item.toJSON() }, data));
    return newData;
  }

  format(firstItem, data) {
    const secondCategory = data.filter(item => firstItem._id.toString() === item.categoryId);
    if (secondCategory.length === 0) {
      return { ...firstItem };
    }
    const newSecondCategory = secondCategory.map(i => this.format({ ...i.toJSON() }, data));
    return { ...firstItem, children: [ ...newSecondCategory ] };
  }
}
