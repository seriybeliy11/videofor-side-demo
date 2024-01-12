import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    setSelectedFiles([...selectedFiles, ...acceptedFiles]);
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setShowResult(false);
    setResultBlob(null);
  };

  const downloadArchive = async () => {
    try {
      setLoading(true);
  
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('file', file);
      });
  
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const blob = await response.blob();
  
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
  
        // Create a link element and set attributes
        const link = document.createElement('a');
        link.href = url;
        link.download = 'images.zip';
  
        // Add the element to the DOM and simulate a click
        document.body.appendChild(link);
        link.click();
  
        // Revoke the temporary URL and remove the element
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        throw new Error(`Error downloading archive: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error downloading archive', error.message);
    } finally {
      setLoading(false);
    }
  };
  

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const submitFiles = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('file', file);
      });

      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Save the blob to use for downloading the archive
        const blob = await response.blob();
        setShowResult(true);
        setResultBlob(blob);
      } else {
        console.error('Error uploading files');
      }
    } catch (error) {
      console.error('Error uploading files', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <div {...getRootProps()} style={dropzoneStyle}>
          <input {...getInputProps()} />
          <p>Drag & drop some files here, or click to select files</p>
        </div>
      </div>
      <div>
        <h2>Selected Files</h2>
        <ul>
          {selectedFiles.map((file, index) => (
            <li key={index}>{file.name}</li>
          ))}
        </ul>
        {selectedFiles.length > 0 && (
          <button className="action-button" onClick={clearFiles}>
            Clear Files
          </button>
        )}
        {selectedFiles.length > 0 && (
          <button className="action-button" onClick={submitFiles} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Files'}
          </button>
        )}
      </div>
      {showResult && (
        <div style={resultContainerStyle}>
          <p>Result</p>
          <button className="action-button" onClick={downloadArchive} disabled={loading}>
            {loading ? 'Downloading...' : 'Download Archive'}
          </button>
        </div>
      )}
    </div>
  );
};

const dropzoneStyle = {
  border: '2px dashed #cccccc',
  borderRadius: '4px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  marginBottom: '20px',
};

const resultContainerStyle = {
  background: 'transparent',
  padding: '15px',
  borderRadius: '4px',
  marginTop: '50px',
  maxWidth: '1000px',
  margin: '0 auto',
  height: '1000px', // Fixed height for the result container
  overflow: 'hidden', // Hide any overflow
};

export default FileUploader;
