import React from 'react';

function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-3xl xs:text-4xl">{children}</h2>;
}
function Description({children}: {children: string}) {
  return <p className="font-sans text-xl xs:text-2xl">{children}</p>;
}
export default function MarketingContent() {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl grid grid-cols-1 gap-8 xs:gap-10">
        <section>
          <Heading>Submit a Pull Request</Heading>
          <Description>
            When you submit a pull request, Rolling Versions asks you to
            describe the changes.
          </Description>
        </section>
        <section>
          <Heading>Add a Change Set</Heading>
          <Description>
            List your changes. You don't need to memorise CLI parameters or some
            magic structure. You just enter the changes into our UI.
          </Description>
        </section>
        <section>
          <Heading>Preview your Changes</Heading>
          <Description>
            Review the changes to be published as part of your pull request. You
            can check that Rolling Versions has chosen the version you expected.
          </Description>
        </section>
        <section>
          <Heading>Publish in CI</Heading>
          <Description>
            Automate the relesase as part of your CI setup so that every release
            is properly tested and published without delay.
          </Description>
        </section>
        <section>
          <Heading>Change Log</Heading>
          <Description>
            When your new version is published, Rolling Versions automatically
            creates a beautiful change log in GitHub and selects the correct new
            version number so that your users know what they're getting when
            they upgrade.
          </Description>
        </section>
      </div>
    </div>
  );
}
