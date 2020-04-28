import React from 'react';

function ContactDescription({children}: {children: string}) {
  return <span className="font-poppins text-4xl">{children}</span>;
}
function ContactLink({children}: {children: React.ReactNode}) {
  return <span className="font-sans text-2xl">{children}</span>;
}

// TODO centre the link on the description - vertical alignment?
// TODO In small screens the vertical spacing is also wrong.
function ContactMethod(
  contactDescription: string,
  contactLink: React.ReactNode,
) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      <div className="sm:col-start-1">
        <ContactDescription>{contactDescription}</ContactDescription>
      </div>
      <div className="sm:col-start-2">
        <ContactLink>{contactLink}</ContactLink>
      </div>
    </div>
  );
}

// TODO make more obvious that these are links?
// TODO twitter link - no idea how to do this
// TODO maybe? symbols for github, twitter and mail?
export default function Contacts() {
  return (
    <div className="container mx-auto">
      {ContactMethod(
        'ByEmail',
        <a href="mailto: hi@rollingversions.com?subject=Rolling Versions">
          hi@rollingversions.com
        </a>,
      )}
      {ContactMethod('By Twitter', '@rollingversions')}
      {ContactMethod(
        'On Github',
        <a href="https://github.com/RollingVersions/RollingVersions">
          RollingVersions/RollingVersions
        </a>,
      )}

      {/* TODO The following the code was for having links on separate lines remove if we go with a single line per method*/}
      {/* <div className="max-w-4xl grid grid-cols-1 gap-10">
        <section>
          <ContactDescription>By Email</ContactDescription>
          <ContactLink>
            <a href="mailto: hi@rollingversions.com?subject = Rolling Versions">
              hi@rollingversions.com
            </a>
          </ContactLink>
        </section>
        <section>
          <ContactDescription>By Twitter</ContactDescription>
          <ContactLink>@rollingversions</ContactLink>
        </section>
        <section>
          <ContactDescription>On GitHub</ContactDescription>
          <ContactLink>
            <a href="https://github.com/RollingVersions/RollingVersions">
              RollingVersions/RollingVersions
            </a>
          </ContactLink>
        </section>
      </div> */}
    </div>
  );
}
