import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ChatInterface from "../components/ChatInterface";
import axios from "axios";
import { Link } from "react-router-dom";
import "./ChatPage.css";

const FeedbackButtons = ({ chunkNumber }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSpreadsheetAction = async (action) => {
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/save-value', {
        value: action,
        point: action === 'GOOD' ? 1 : action === 'BAD' ? 0.1 : action,
        chunkNumber,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const buttons = ['GOOD', 'BAD', 'DUP', 'PURGE'];

  return (
    <div className="feedback-buttons">
      {buttons.map(action => (
        <button
          key={action}
          onClick={() => handleSpreadsheetAction(action)}
          disabled={isLoading}
          className={action.toLowerCase()}
        >
          {action}
        </button>
      ))}
    </div>
  );
};

const ChunkComponent = ({ chunk, onFetchAutomation, isLoading, latestPetition }) => {
  const [processStatus, setProcessStatus] = useState("idle");
  const [processError, setProcessError] = useState(null);

  const handleFetchAndSave = async () => {
    try {
      setProcessStatus("loading");
      setProcessError(null);
      await onFetchAutomation(chunk);
      setProcessStatus("success");
    } catch (error) {
      setProcessStatus("error");
      setProcessError(error.message);
    }
  };

  return (
    <div className="chunk-wrapper">
      <div className="chunk-container">
        <h3>Chunk {chunk.chunk_number}</h3>
        <div className="chunk-image">
          <img src={chunk.image_url} alt={`Chunk ${chunk.chunk_number}`} />
        </div>
        <div className="chunk-data">
          <p><strong>First Name:</strong> {chunk.ocr_data.first_name || "Not detected"}</p>
          <p><strong>Last Name:</strong> {chunk.ocr_data.last_name || "Not detected"}</p>
          <p><strong>Address:</strong> {chunk.ocr_data.address || "Not detected"}</p>
          <p><strong>Zip Code:</strong> {chunk.ocr_data.zip_code || "Not detected"}</p>
        </div>
        <button
          onClick={handleFetchAndSave}
          disabled={isLoading || processStatus === "loading" || !latestPetition}
          className="automation-button"
        >
          Process & Save Data
        </button>
        {processError && <div className="error-message">{processError}</div>}
      </div>
      <FeedbackButtons chunkNumber={chunk.chunk_number} />
    </div>
  );
};

const ChatPage = ({ user, currentPetition, petitionText, getNextPetition }) => {
  const [image, setImage] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [isLoadingAutomation, setIsLoadingAutomation] = useState(false);
  const [latestPetition, setLatestPetition] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageInfo, setImageInfo] = useState({ name: null, petition: null });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const nextPetition = await getNextPetition();
        if (nextPetition) {
          setImageInfo({
            name: file.name,
            petition: `petition${nextPetition}`
          });

          const formData = new FormData();
          formData.append('file', file);
          formData.append('petition', nextPetition);

          const response = await axios.post('http://localhost:5000/api/process-image', formData);
          if (response.data.success) {
            setProcessedData(response.data);
            setUploadedImage(URL.createObjectURL(file));
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to process image');
      }
    }
  };

  if (!user) {
    return <p className="login-warning">Please log in to access the chat.</p>;
  }

  return (
    <div className="chat-page">
      <div className="upload-section">
        <h2>Upload an image for detection</h2>
        <input
          type="file"
          onChange={handleImageUpload}
          accept="image/*"
          className="file-input"
        />
        {petitionText && <div className="petition-info">{petitionText}</div>}
        {imageInfo.name && (
          <>
            <p>Image uploaded: {imageInfo.name}</p>
            <p>Current Petition: {imageInfo.petition}</p>
            <h2>Uploaded Image</h2>
            <img src={uploadedImage} alt="Uploaded petition" style={{maxWidth: '100%'}} />
          </>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="chunks-grid">
        {processedData?.chunks?.map((chunk) => (
          <ChunkComponent
            key={chunk.chunk_number}
            chunk={chunk}
            onFetchAutomation={fetchAutomationData}
            isLoading={isLoadingAutomation}
            latestPetition={latestPetition}
          />
        ))}
      </div>

      <ChatInterface user={user} />
    </div>
  );
};

ChatPage.propTypes = {
  user: PropTypes.object,
  currentPetition: PropTypes.string,
  petitionText: PropTypes.string,
  getNextPetition: PropTypes.func
};

export default ChatPage;