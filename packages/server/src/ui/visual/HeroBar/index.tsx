import React from 'react';
import installIcon from './install-icon.svg';
import background from './background-image.svg';

export default function HeroBar() {
  return (
    <>
      <div className="bg-orange-500 py-12 block md:hidden">
        {/* TODO Forbes - I have removed `grid grid-cols-1 gap-6 max-w-4xl ` from the following as it seems to upset the layout of the text - squeezing it to the side - and I don't think it is applicable here.
        If I'm wrong it will need to go back.
        Note: text on this and everything else is jammed against left margins on small screens*/}
        <div className="container mx-auto font-poppins font-normal text-3xl text-white italic">
          <p>Add change sets to pull requests</p>
          <p>Automatically release with change logs</p>
        </div>
      </div>
      <div
        className="bg-orange-500 h-64 pt-20 bg-no-repeat hidden md:block"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)',
          backgroundImage: `url(${background})`,
          backgroundPosition: 'center right 15%',
          backgroundSize: 'auto 140%',
        }}
      >
        <div className="container mx-auto flex items-end">
          <div className="flex-grow max-w-4xl font-poppins font-normal text-3xl text-white italic">
            <p>Add change sets to pull requests</p>
            <p>Automatically release with change logs</p>
          </div>
          <a
            href="https://github.com/apps/rollingversions/installations/new"
            className="hidden lg:flex items-center justify-center h-12 w-40 bg-black text-white text-2xl italic font-poppins font-black"
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
    </>
  );
}

export function HeroBarFooter() {
  return (
    <div
      className="bg-orange-500 h-64 bg-no-repeat flex"
      style={{
        clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 100%)',
        backgroundImage: `url(${background})`,
        backgroundSize: 'auto 130%',
        backgroundPosition: 'center left 10%',
      }}
    >
      <div className="container mx-auto flex flex-grow items-center">
        <a
          href="https://github.com/apps/rollingversions/installations/new"
          className="flex flex-grow items-center justify-center h-20 bg-black text-white text-4xl italic font-poppins font-black"
        >
          INSTALL
          <div className="w-3" />
          <img
            aria-hidden={true}
            width="49"
            height="75"
            className="h-8 w-auto"
            src={installIcon}
          />
        </a>
      </div>
    </div>
  );
}

//TODO I'm not sure this is the right place for this I'm also not convinced about using
// `top: '-51px'` but this was the only way I could get the two polygons to "connect"
export function HeroBarBanner({children}: {children: string}) {
  return (
    <>
      <div className="bg-black py-12 block md:hidden">
        <div className="container mx-auto grid font-poppins font-normal text-2xl text-white italic">
          {children}
        </div>
      </div>
      <div
        className="bg-black h-64 pt-20 bg-no-repeat hidden md:block "
        style={{
          position: 'relative',
          top: '-51px',
          clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 100%)',
          backgroundSize: 'auto 130%',
          backgroundPosition: 'center left 10%',
        }}
      >
        <div className="container mx-auto flex items-end">
          <div className="flex-grow font-poppins text-2xl text-white italic">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
