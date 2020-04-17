import React from 'react';

function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-4xl">{children}</h2>;
}
function Description({children}: {children: string}) {
  return <p className="font-sans text-2xl">{children}</p>;
}
export default function MarketingContent() {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl grid grid-cols-1 gap-10">
        <section>
          <Heading>Submit a Pull Request</Heading>
          <Description>
            When your developers submit a pull request, Rolling Versions asks
            them to descirbe the changes.
          </Description>
        </section>
        <section>
          <Heading>Add a Change Set</Heading>
          <Description>
            Use our simple UI to list the changes in plain language that will be
            understood by the users of your library.
          </Description>
        </section>
        <section>
          <Heading>Preview the Changes</Heading>
          <Description>
            Review the change set and which versions will be published as part
            of the pull request.
          </Description>
        </section>
        <section>
          <Heading>Publish in CI</Heading>
          <Description>
            Automate the release as part of your CI setup so that every release
            is properly tested.
          </Description>
        </section>
        <section>
          <Heading>Change Log</Heading>
          <Description>
            When the new version is published, the Rolling Versions CLI
            automatically creates a beautiful change log in GitHub and selects
            the correct new version number so your users know what they're
            getting when they upgrade.
          </Description>
        </section>
      </div>
    </div>
  );
}
