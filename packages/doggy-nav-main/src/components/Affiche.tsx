import { useState } from 'react';
import { Carousel } from '@arco-design/web-react';
import { Link as ArcoLink } from '@arco-design/web-react';
import { IconCloseCircle } from '@arco-design/web-react/icon';
import Link from 'next/link';

export default function Affiche() {
  const [show, setShow] = useState(true);

  if (!show) {
    return null;
  }

  return (
    <div className="bg-white rounded-md p-2 text-sm relative">
      <ArcoLink
        icon={<IconCloseCircle className="text-gray-400 hover:text-gray-600"/>}
        onClick={() => setShow(false)}
        className="absolute top-1 right-1"
      />
      <Carousel
        direction="vertical"
        style={{ height: 30 }}
        className="pointer-events-none"
        showArrow={"hover"}
        autoPlay
      >
          <p className="m-0" key={'suggest'} onClick={console.info}>
            如果您有建议，请
            <Link
              className="text-blue-500 !underline hover:text-blue-700 pointer-events-auto"
              href="https://github.com/MARVElOUS-DEV/doggy-nav"
              target="_blank"
              rel="noopener noreferrer"
            >
              前往提交
            </Link>
          </p>
          <p className="m-0" key={'issue'} onClick={console.info}>
            支持提交网站带个人信息了，欢迎大家提交网站
            <Link className="text-blue-500 !underline hover:text-blue-700 pointer-events-auto" href="/recommend">
              去提交
            </Link>
          </p>
      </Carousel>
    </div>
  );
}