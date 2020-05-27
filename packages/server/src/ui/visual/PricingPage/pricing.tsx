import React from 'react';

export default function Pricing() {
  return (
    <div>
      <div className="bg-gray-200 mx-12">
        <div className="w-screen h-auto overflow-visible">
          <div
            className="bg-black h-56 -mx-12"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 81.25%, 0 100%)',
            }}
          >
            <div className="container mx-auto flex justify-center pt-12 overflow-visible">
              <div className="mt-12 mx-4 h-56 w-56 border border-orange-500  bg-white max-w-4xl font-poppins font-normal text-3xl text-white italic">
                <p className="text-gray-900 text-center">Hobby</p>
              </div>
              <div className="h-64 w-56 border border-4 border-orange-500  bg-white max-w-4xl font-poppins font-normal text-3xl text-white italic">
                <p className="text-gray-900 text-center">Teams</p>
              </div>
              <div className="mt-12 h-56 w-56 mx-4 border border-orange-500  bg-white max-w-4xl font-poppins font-normal text-3xl text-white italic">
                <p className="text-gray-900 text-center">Enterprise</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <p className="font-sans text-xl">
            We love open source and plan to keep Rolling versions{' '}
            <span className="italic text-orange-500">forever free </span>
            to Open Source projects
          </p>
        </div>
      </div>
    </div>
  );
}
