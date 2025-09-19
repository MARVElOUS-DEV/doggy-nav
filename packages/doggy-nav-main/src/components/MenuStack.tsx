import { Category } from '@/types';

interface MenuStackProps {
  menuList: Category[];
  onHandleSubMenuItemClick: (parentId: string, id: string) => void;
}

export default function MenuStack({ menuList, onHandleSubMenuItemClick }: MenuStackProps) {
  return <div>Menu Stack</div>;
}
