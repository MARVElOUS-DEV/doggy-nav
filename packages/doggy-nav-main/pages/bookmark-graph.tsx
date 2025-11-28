import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const BookmarkGraphEditor = dynamic(
  () => import('@/apps/BookmarkGraph/BookmarkGraphEditor'),
  { ssr: false }
);

const BookmarkGraphPage = () => {
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

export default BookmarkGraphPage;
