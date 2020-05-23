import React from 'react';
import InstallIcon from './install-icon.svg';
// tslint:disable-next-line:no-implicit-dependencies
import background from '!url-loader!./background-image.svg';

export function InstallButton({
  size = 'sm',
  shadow = 'shadow-gray',
}: {
  size?: 'sm' | 'lg';
  shadow?: 'shadow-gray' | 'shadow-orange' | 'shadow-white';
}) {
  return (
    <a
      href="https://github.com/apps/rollingversions/installations/new"
      className={`flex items-center justify-center bg-black text-white italic font-poppins font-black focus:outline-none focus:${shadow} ${
        size === 'lg' ? `h-20 flex-grow text-4xl` : `h-12 w-40 text-2xl`
      }`}
    >
      INSTALL
      <div className={size === 'lg' ? 'w-3' : 'w-2'} />
      <InstallIcon
        aria-hidden={true}
        className={size === 'lg' ? 'h-8 w-auto' : 'h-6 w-auto'}
      />
    </a>
  );
}
export default function HeroBar({
  children,
  callToAction,
}: {
  children: React.ReactNode;
  callToAction?: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-orange-500 py-12 block md:hidden">
        <div className="container mx-auto grid grid-cols-1 gap-6 font-poppins font-normal text-3xl text-white italic">
          {children}
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
            {children}
          </div>
          <div className="hidden lg:flex">{callToAction}</div>
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
        <InstallButton size="lg" shadow="shadow-white" />
      </div>
    </div>
  );
}

export function HeroBarBanner({children}: {children: string}) {
  return (
    <>
      <div className="bg-black py-8 block md:hidden">
        <div className="container mx-auto grid font-poppins font-normal text-xl text-white italic">
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
          <div className="max-w-3xl flex-grow font-poppins text-2xl text-white italic">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
