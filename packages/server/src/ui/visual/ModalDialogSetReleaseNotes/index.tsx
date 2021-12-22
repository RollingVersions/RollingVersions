import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import ModalDialog, {ModalDialogProps} from '../ModalDialog';

export default function ModalDialogSetReleaseNotes({
  open,
  closeLink,
  releaseNotes,
  onSave,
}: Pick<ModalDialogProps, 'open' | 'closeLink'> & {
  releaseNotes: string | undefined;
  onSave: (releaseNotes: string) => void;
}) {
  const [editedReleaseNotes, setEditedReleaseNotes] = React.useState(
    releaseNotes ?? ``,
  );
  React.useEffect(() => {
    if (releaseNotes !== undefined) {
      setEditedReleaseNotes(releaseNotes);
    }
  }, [releaseNotes]);
  return (
    <ModalDialog
      title="Set Release Description"
      open={open}
      closeLink={closeLink}
    >
      <form
        className="mt-5 sm:mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(editedReleaseNotes);
        }}
      >
        <p className="text-sm text-gray-700 mb-4">
          Adding a release description allows you to provide a summary before
          the structured list of changes. You may also use it to provide
          highlights of the release.
        </p>
        <p className="text-sm text-gray-700 mb-4">
          This supports markdown, so you can also include images or even links
          to YouTube videos.
        </p>
        <TextareaAutosize
          inputRef={(textArea) => {
            if (open && textArea) {
              textArea.focus();
            }
          }}
          aria-label="Release Notes"
          className="p-2 resize-none w-full rounded-lg border-2 border-gray-400"
          value={editedReleaseNotes}
          onChange={(e) => {
            setEditedReleaseNotes(e.target.value);
          }}
        />
        <button
          type="submit"
          className="w-full flex items-center justify-center bg-black text-white font-poppins font-black h-8 px-4 text-lg focus:outline-none focus:shadow-gray"
        >
          Save
        </button>
      </form>
    </ModalDialog>
  );
}
