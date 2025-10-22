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
    const parentId = firstItem.id || (firstItem._id && typeof firstItem._id.toString === 'function' ? firstItem._id.toString() : firstItem._id);
    const secondCategory = data.filter(item => parentId === item.categoryId);
    if (secondCategory.length === 0) {
      return { ...firstItem };
    }
    const newSecondCategory = secondCategory.map(i => this.format({ ...i.toJSON() }, data));
    return { ...firstItem, children: [ ...newSecondCategory ] };
  }
}
