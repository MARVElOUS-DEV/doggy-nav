import dynamic from 'next/dynamic';

const BookmarkGraphEditor = dynamic(() => import('./BookmarkGraphEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-gray-500">
      Loading bookmark editor...
    </div>
  ),
});

const BookmarkGraphApp = () => {
  return <BookmarkGraphEditor />;
};

export default BookmarkGraphApp;
