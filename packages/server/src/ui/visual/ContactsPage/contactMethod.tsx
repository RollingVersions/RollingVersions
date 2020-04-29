import React from 'react';

function ContactDescription({children}: {children: string}) {
  return <span className="font-poppins text-4xl sm:text-2xl">{children}</span>;
}
function ContactLink({children}: {children: React.ReactNode}) {
  return <span className="font-sans text-3xl">{children}</span>;
}

// TODO In x-small screens the vertical spacing is still wrong.
export default function ContactMethod({
  contactDescription,
  contactLink,
}: {
  contactDescription: string;
  contactLink: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 items-center mb-8 grid-cols-1 sm:grid-cols-3">
      <ContactDescription>{contactDescription}</ContactDescription>
      <ContactLink>{contactLink}</ContactLink>
    </div>
  );
}
