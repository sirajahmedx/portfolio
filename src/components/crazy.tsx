'use client';

import React from 'react';
import { Photos, PhotoItem } from './photos';

const Crazy = () => {
  const sportPhotos: PhotoItem[] = [
    {
      src: '/blancmont.JPG',
      alt: 'Mont Blanc',
      caption: 'On top of Mont Blanc (me in blue behind)',
    },
  ];

  return (
    <div className="mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-foreground text-3xl font-semibold md:text-4xl">
          Mont Blanc (4810m)
        </h2>
      </div>
      <Photos photos={sportPhotos} />
    </div>
  );
};

export default Crazy;