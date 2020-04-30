import React from 'react';

function ContactDescription({children}: {children: string}) {
  return (
    <span className="font-poppins text-gray-700 hidden sm:block text-xl">
      {children}
    </span>
  );
}
function ContactLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="font-sans text-gray-900 text-lg xs:text-2xl sm:text-3xl md:text-4xl flex items-center"
    >
      {children}
    </a>
  );
}

export default function ContactMethod({
  contactDescription,
  contactLink,
  contactAddress,
  contactIcon,
}: {
  contactDescription: string;
  contactLink: string;
  contactAddress: string;
  contactIcon: string;
}) {
  return (
    <div>
      <ContactDescription>{contactDescription}</ContactDescription>
      <ContactLink href={contactLink}>
        <img
          className="h-12 w-12"
          src={contactIcon}
          alt={contactDescription + ' Icon'}
        />{' '}
        {contactAddress}
      </ContactLink>
    </div>
  );
}
