import { useState } from 'react';
import { Carousel } from '@arco-design/web-react';
import Link from 'next/link';

export default function Affiche() {
  const [show, setShow] = useState(true);

  if (!show) {
    return null;
  }

  return (
    <div className="affiche flex items-center bg-white rounded-md p-2 text-sm">
      <Carousel direction="vertical" style={{ height: 30, flex: 1 }}>
        <div>
          <p className="m-0">
            一个好的产品要经历千锤百炼，我们需要你的建议。
            <Link
              className="text-blue-500 underline"
              href="https://github.com/MARVElOUS-DEV/doggy-nav"
              target="_blank"
              rel="noopener noreferrer"
            >
              去围观
            </Link>
          </p>
        </div>
        <div>
          <p className="m-0">
            支持提交网站带个人信息了，欢迎大家提交网站
            <Link className="text-blue-500 underline" href="/recommend">
              去提交
            </Link>
          </p>
        </div>
      </Carousel>
      <i className="el-icon-close text-lg font-bold cursor-pointer" onClick={() => setShow(false)}></i>
    </div>
  );
}
