import React from 'react';
import Chat from '@/components/chat';

const Page = () => {
  return (
    <div className="bg-gradient-to-r from-gray-700 via-gray-900 text-white to-black h-screen flex justify-center items-center gap-2">
      <Chat/>
    </div>
  );
};

export default Page;