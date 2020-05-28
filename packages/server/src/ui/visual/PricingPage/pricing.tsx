import React from 'react';
import OptionBox from './optionBox';

export default function Pricing() {
  return (
    <div>
      <div className="bg-gray-200 sm:mx-8 lg:mx-12 xl:mx-32">
        <div className="h-auto">
          <div
            className="bg-gray-900 h-64 sm:-mx-8 lg:-mx-12 xl:-mx-32"
            style={{
              height: '20rem',
              clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
            }}
          >
            <h1 className="font-poppins font-normal text-orange-500 text-4xl lg:text-5xl py-6 lg:py-4 text-center">
              Pricing
            </h1>
          </div>
          <div
            className="mx-4 sm:mx-8 lg:mx-12 xl:mx-32 grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-12"
            style={{position: 'relative', marginTop: '-220px'}}
          >
            <OptionBox
              className="mx-4 md:mx-0 md:my-12 border"
              optionName="Hobby"
              benefits={[
                'Individual projects',
                'Up to two users',
                'Easy set-up',
                'Fully hosted',
                'Unlimited repositories',
                'Community support',
              ]}
            />
            <OptionBox
              className="border-4"
              optionName="Teams"
              benefits={[
                'Perfect for teams of 3 or more',
                'Integrates with github teams',
                'Easy set-up',
                'Fully hosted',
                'Unlimited repositories',
                'Community support',
              ]}
            />
            <OptionBox
              className="mx-4 md:mx-0 md:my-12 border"
              optionName="Enterprise"
              benefits={[
                'Unlimited users',
                'Integrates with github enterprise',
                'Self-hosted',
                'Unlimited repositories',
                'Tailored support',
              ]}
            />
          </div>
        </div>

        <p className="font-sans text-xl lg:text-2xl text-center py-12">
          We love open source and plan to keep Rolling versions{' '}
          <span className="italic text-orange-500">forever free </span>
          to Open Source projects
        </p>
      </div>
    </div>
  );
}
