import React from 'react';

function OptionBox({
  optionName,
  benefits,
  className,
}: {
  optionName: string;
  benefits: string[];
  className?: string;
}) {
  return (
    <div
      className={`mx-3 w-64 border-orange-500  bg-white font-poppins font-normal text-3xl text-gray-900 ${className ||
        ''}`}
    >
      <p className="text-center">{optionName}</p>
      <ul className="font-sans text-xl list-square ml-6">
        {benefits.map((benefit) => (
          <li>{benefit}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing() {
  return (
    <div>
      <div className="bg-gray-200 mx-12">
        <div className="w-screen h-auto">
          <div
            className="bg-gray-900 h-64 -mx-12"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
            }}
          ></div>
          <div
            className="flex justify-center pt-12"
            style={{position: 'relative', marginTop: '-220px'}}
          >
            <OptionBox
              className="mt-12 border"
              optionName="Hobby"
              benefits={[
                'Individual projects',
                'Working with a friend',
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
              className="mt-12 border"
              optionName="Enterprise"
              benefits={[
                'Unlimited users',
                'Self-hosted',
                'Integrates with github enterprise',
                'Unlimited repositories',
                'Tailored support',
              ]}
            />
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
