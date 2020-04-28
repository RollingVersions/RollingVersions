import React from 'react';

function ContactDescription({children}: {children: string}) {
  return <span className="font-poppins text-4xl">{children}</span>;
}
function ContactLink({children}: {children: React.ReactNode}) {
  return <span className="font-sans text-2xl">{children}</span>;
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
    <div className="grid gap-4 items-center grid-cols-1 sm:grid-cols-2">
      <div className="sm:col-start-1">
        <ContactDescription>{contactDescription}</ContactDescription>
      </div>
      <div className="sm:col-start-2">
        <ContactLink>{contactLink}</ContactLink>
      </div>
    </div>
  );
}
