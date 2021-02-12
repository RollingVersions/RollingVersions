import React from 'react';

export default function OptionBox({
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
      className={`border-orange-500 p-2 sm:p-3 xl:p-4 bg-white font-poppins font-normal text-2xl lg:text-3xl text-gray-900 ${className ||
        ''}`}
    >
      <h2 className="text-center pt-2 sm:pt-3 xl:pt-4">{optionName}</h2>
      <p className="text-center font-sans pb-2 sm:pb-3 xl:pb-4 text-xl lg:text-2xl text-orange-500 italic">
        Free in Beta
      </p>
      <ul className="font-sans text-base sm:text-lg md:text-base lg:text-xl list-square ml-6 pb-2 sm:pb-3 xl:p-4">
        {benefits.map((benefit) => (
          <li>{benefit}</li>
        ))}
      </ul>
    </div>
  );
}
