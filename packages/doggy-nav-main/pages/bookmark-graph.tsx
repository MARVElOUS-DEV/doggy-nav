import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { NextPageWithLayout } from './_app';

const BookmarkGraphEditor = dynamic(
  () => import('@/apps/BookmarkGraph/BookmarkGraphEditor'),
  { ssr: false }
);

const BookmarkGraphPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Bookmark Graph Editor | DoggyNav</title>
        <meta name="description" content="Visual Bookmark Management with Node Graph" />
      </Head>
      <div className="w-screen h-screen overflow-hidden">
        <BookmarkGraphEditor />
      </div>
    </>
  );
};

BookmarkGraphPage.getLayout = (page) => page;

export default BookmarkGraphPage;
