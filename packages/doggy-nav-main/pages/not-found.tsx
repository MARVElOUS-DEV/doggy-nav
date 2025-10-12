'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const router = useRouter();
  const { t } = useTranslation('translation');

  return (
    <div className='absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center'>
      <span className='from-foreground bg-linear-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent'>
        404
      </span>
      <h2 className='font-heading my-2 text-2xl font-bold'>
        {t('something_missing')}
      </h2>
      <p>
        {t('page_not_found')}
      </p>
      <div className='mt-8 flex justify-center gap-2'>
        <Button onClick={() => router.back()} type='primary' size='large'>
          {t('go_back')}
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          type='outline'
          size='large'
        >
          {t('back_to_home_button')}
        </Button>
      </div>
    </div>
  );
}

NotFound.getLayout = function getLayout(page: React.ReactElement) {
  return <>{page}</>;
};
