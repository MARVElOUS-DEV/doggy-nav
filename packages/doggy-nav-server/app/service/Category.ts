import { Service } from 'egg';

export default class CategoryService extends Service {
  formatCategoryList(data) {
    const stairCategoryList = data.filter(item => !item.categoryId);
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
