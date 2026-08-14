import dynamic from 'next/dynamic';
import Head from 'next/head';
import AuthGuard from '@/components/AuthGuard';
import type { NextPageWithLayout } from './_app';

const BookmarkGraphEditor = dynamic(() => import('@/apps/BookmarkGraph/BookmarkGraphEditor'), {
  ssr: false,
});

const BookmarkGraphPage: NextPageWithLayout = () => {
  return (
    <AuthGuard redirectTo="/login">
      <>
        <Head>
          <title>Bookmark Graph Editor</title>
          <meta name="description" content="Visual Bookmark Management with Node Graph" />
        </Head>
        <div className="w-screen h-screen overflow-hidden">
          <BookmarkGraphEditor />
        </div>
      </>
    </AuthGuard>
  );
};

BookmarkGraphPage.getLayout = (page) => page;

export default BookmarkGraphPage;
