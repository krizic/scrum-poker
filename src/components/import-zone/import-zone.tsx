import * as React from "react";
import {useDropzone} from "react-dropzone";
import {Message} from "semantic-ui-react";

export interface IImportZoneProps {
  onFileUploaded: (files: File[]) => void;
}

export function ImportZone(props: IImportZoneProps) {
  const onDrop = React.useCallback((acceptedFiles) => {
    props.onFileUploaded(acceptedFiles);
  }, [props]);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  const msg = isDragActive
    ? "Drop the file here ..."
    : "Drag 'n' drop CSV file here, or click to select one";

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Message info icon="upload" header="Import from CSV file" content={msg} />
    </div>
  );
}
