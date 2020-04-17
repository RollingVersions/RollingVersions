import React from 'react';
import installIcon from './install-icon.svg';
import background from './background-image.svg';

export default function HeroBar() {
  return (
    <div
      className="bg-orange-500 h-64 pt-20 bg-no-repeat"
      style={{
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)',
        backgroundImage: `url(${background})`,
        backgroundPosition: 'center right 15%',
      }}
    >
      <div className="container mx-auto flex items-end">
        <div className="flex-grow max-w-4xl font-poppins font-normal text-3xl text-white italic">
          <p>Add change sets to pull requests</p>
          <p>Automatically release with change logs</p>
        </div>
        <a
          href="https://github.com/apps/rollingversions/installations/new"
          className="flex items-center justify-center h-12 w-40 bg-black text-white text-2xl"
        >
          INSTALL
          <div className="w-2" />
          <img
            aria-hidden={true}
            width="49"
            height="75"
            className="h-6 w-auto"
            src={installIcon}
          />
        </a>
      </div>
    </div>
  );
}
