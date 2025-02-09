import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import ChatInterface from "../components/ChatInterface";
import SearchForm from "../components/SearchForm";
import axios from "axios";
import "./combined_page.css";

const SEARCH_METHODS = {
  "method1": {
    label: "First Initial + Last Initial Search",
    description: "First letter of First Name + First letter of Last Name + Street Number + First letter of Street Name + ZIP Code"
  },
  "method2": {
    label: "First Initial + Full Last Name Search",
    description: "First letter of First Name + Full Last Name + Street Number + First letter of Street Name + ZIP Code"
  },
  "method3": {
    label: "Full Name + Street Search",
    description: "Full First Name + Full Last Name + Street Number + First letter of Street Name + ZIP Code"
  },
  "method4": {
    label: "Complete Address Search",
    description: "Full First Name + Full Last Name + Full Address + ZIP Code"
  },
  "method5": {
    label: "Street Only Search",
    description: "Street Number + Full Street Name + ZIP Code"
  }
};

const ChunkDisplay = ({ chunk, onFetchAutomation, isLoading, latestPetition }) => {
  const [editableData, setEditableData] = useState(chunk.ocr_data);
  const [searchMethod, setSearchMethod] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [processStatus, setProcessStatus] = useState("idle");
  const [processError, setProcessError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleDataEdit = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    try {
      setProcessStatus("loading");
      setProcessError(null);
      
      // Format search criteria based on selected method
      const searchCriteria = {
        method: searchMethod,
        ...editableData
      };

      // Make the search request
      const response = await axios.get('http://localhost:5000/api/search', {
        params: searchCriteria
      });
      
      setSearchResults(response.data.results);
      setProcessStatus("success");

      // Automatically save screenshot
      if (response.data.results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultType = response.data.results.length > 0 ? 'match' : 'no-match';
        await saveSearchResultScreenshot(
          response.data.results,
          searchCriteria,
          `signature-${chunk.chunk_number}-${resultType}-${timestamp}.png`
        );
      }
    } catch (error) {
      setProcessStatus("error");
      setProcessError(error.message);
    }
  };

  const saveSearchResultScreenshot = async (results, searchParams, filename) => {
    try {
      const resultsElement = document.querySelector('.search-results');
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(resultsElement);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  };

  return (
    <div className="chunk-container">
      <h3>Signature {chunk.chunk_number}</h3>
      <div className="chunk-content">
        <div className="chunk-image">
          <img src={chunk.image_url} alt={`Chunk ${chunk.chunk_number}`} />
        </div>
        
        <div className="chunk-data">
          {/* Editable OCR Data */}
          <div className="editable-fields">
            {Object.entries(editableData).map(([field, value]) => (
              <div key={field} className="editable-field">
                <label>{field.replace('_', ' ')}:</label>
                <input
                  type="text"
                  value={value || ""}
                  onChange={(e) => handleDataEdit(field, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Search Method Selection */}
          <div className="search-method-selector">
            <label>Search Method:</label>
            <select 
              value={searchMethod}
              onChange={(e) => setSearchMethod(e.target.value)}
            >
              <option value="">Select Search Method</option>
              {Object.entries(SEARCH_METHODS).map(([key, {label}]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!searchMethod || isLoading || processStatus === "loading"}
            className="search-button"
          >
            {processStatus === "loading" ? "Searching..." : "Search"}
          </button>

          {/* Search Results Display */}
          {searchResults && (
            <div className="search-results">
              <div className="search-details">
                <h3>Search Details</h3>
                <p><strong>Date & Time:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Search Method:</strong> {SEARCH_METHODS[searchMethod]?.label || 'No method selected'}</p>
                <p><strong>Search Criteria:</strong></p>
                <ul>
                  {Object.entries(editableData).map(([key, value]) => (
                    value && <li key={key}><strong>{key.replace('_', ' ')}:</strong> {value}</li>
                  ))}
                </ul>
                <p><strong>Results Found:</strong> {searchResults?.length || 0}</p>
              </div>

              {searchResults?.map((result, index) => (
                <div key={`${result.first_name}-${result.last_name}-${index}`} className="match-card">
                  <h5>Match #{index + 1}</h5>
                  <div className="match-details">
                    <div className="detail-row">
                      <span className="detail-label">First Name:</span>
                      <span className="detail-value">{result.first_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Name:</span>
                      <span className="detail-value">{result.last_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{result.address}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Zip Code:</span>
                      <span className="detail-value">{result.zip_code}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {processError && <div className="error-message">{processError}</div>}
          {searchError && <div className="error-message">{searchError}</div>}
        </div>

        {/* Feedback Buttons */}
        <FeedbackButtons 
          chunkNumber={chunk.chunk_number}
          onFeedback={(feedback) => {
            // Save to spreadsheet with appropriate values
            // GOOD: 1, BAD: 0.1, DUP: 0, PURGE: -1
          }}
          activePetition={latestPetition}
        />
      </div>
    </div>
  );
};

const FeedbackButtons = ({ chunkNumber, onFeedback, activePetition }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  const handleFeedback = async (action) => {
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/save-value', {
        value: action,
        chunkNumber,
        petition: activePetition,
        timestamp: new Date().toISOString()
      });
      setFeedbackStatus(action);
      onFeedback(action);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="feedback-buttons">
      <button
        onClick={() => handleFeedback('GOOD')}
        disabled={isLoading}
        className={`feedback-btn good ${feedbackStatus === 'GOOD' ? 'active' : ''}`}
      >
        GOOD
      </button>
      <button
        onClick={() => handleFeedback('BAD')}
        disabled={isLoading}
        className={`feedback-btn bad ${feedbackStatus === 'BAD' ? 'active' : ''}`}
      >
        BAD
      </button>
      <button
        onClick={() => handleFeedback('DUP')}
        disabled={isLoading}
        className={`feedback-btn dup ${feedbackStatus === 'DUP' ? 'active' : ''}`}
      >
        DUP
      </button>
      <button
        onClick={() => handleFeedback('PURGE')}
        disabled={isLoading}
        className={`feedback-btn purge ${feedbackStatus === 'PURGE' ? 'active' : ''}`}
      >
        PURGE
      </button>
    </div>
  );
};

const CombinedPage = ({ user }) => {
  const [image, setImage] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [isLoadingAutomation, setIsLoadingAutomation] = useState(false);
  const [latestPetition, setLatestPetition] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [method, setMethod] = useState('');
  const [searchInfo, setSearchInfo] = useState({
    searchTime: null,
    searchCriteria: {},
    searchMethod: ''
  });

  useEffect(() => {
    // Cleanup function
    return () => {
      setLatestPetition(null);
      setProcessedData(null);
      setImage(null);
      setError(null);
      setAutomationData(null);
    };
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Clear previous data
        setImage(null);
        setProcessedData(null);
        setError(null);
        setAutomationData(null);
        setLatestPetition(null);  // Clear the current petition
        
        // Set new image
        setImage(file);
        
        // Get latest petition number first
        const petitionResponse = await axios.get('http://localhost:5000/api/latest-petition');
        const newPetition = petitionResponse.data.latest_petition;
        setLatestPetition(newPetition);
        
        // Then process the image
        const formData = new FormData();
        formData.append("file", file);
        formData.append("petition", newPetition);
        
        setIsLoadingAutomation(true);
        
        const response = await axios.post(
          "http://localhost:5000/api/process-image",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        setProcessedData(response.data);
        
      } catch (error) {
        console.error("Error processing image:", error);
        setError(error.response?.data?.error || "Error processing image");
      } finally {
        setIsLoadingAutomation(false);
      }
    }
  };

  const handleGlobalSearch = async (params) => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    
    setSearchInfo({
      searchTime: new Date(),
      searchCriteria: params,
      searchMethod: params.method
    });

    try {
      const response = await axios.get('http://localhost:5000/api/search', {
        params: params
      });

      if (response.data.error) {
        setSearchError(response.data.error);
      } else {
        setSearchResults(response.data.results);
      }
    } catch (error) {
      setSearchError("An error occurred while searching");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleProcessPetition = async (chunkData) => {
    if (!latestPetition) throw new Error("No petition number available");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/process-petition",
        {
          first_name: chunkData.ocr_data.first_name,
          last_name: chunkData.ocr_data.last_name,
          address: chunkData.ocr_data.address,
          zip_code: chunkData.ocr_data.zip_code,
          petition: latestPetition
        }
      );

      if (!response.data) throw new Error("No response data received");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to process petition: ${error.message}`);
    }
  };

  const fetchAutomationData = async (chunkData) => {
    setIsLoadingAutomation(true);
    setError(null);

    try {
      const petitionData = await handleProcessPetition(chunkData);
      if (!petitionData.data) throw new Error("Invalid petition data received");

      setAutomationData(prevData => ({
        ...prevData,
        [chunkData.chunk_number]: petitionData.data
      }));

      return petitionData;
    } catch (error) {
      setError(`Automation failed: ${error.message}`);
      throw error;
    } finally {
      setIsLoadingAutomation(false);
    }
  };

  const handleInsertAllAutomationData = async () => {
    if (!processedData?.chunks) return;

    setIsLoadingAutomation(true);
    try {
      const chunksData = processedData.chunks.map(chunk => ({
        ...chunk,
        petition: latestPetition,
        image_url: chunk.image_url
      }));

      const response = await axios.post(
        "http://localhost:5000/api/insert-all-automation-data",
        {
          chunks: chunksData,
          petition: latestPetition
        }
      );

      if (response.data.success) {
        setAutomationData(response.data.results);
        alert("Successfully processed all chunks!");
      }
    } catch (error) {
      setError(`Failed to process all chunks: ${error.message}`);
    } finally {
      setIsLoadingAutomation(false);
    }
  };

  if (!user) {
    return <p className="login-warning">Please log in to access this page.</p>;
  }

  return (
    <div className="combined-page">
      <h2>Upload and Search Petitions</h2>
      <div className="main-grid">
        <div className="left-panel">
          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            className="file-input"
            disabled={isLoadingAutomation}
          />
          {image && <p>Image uploaded: {image.name}</p>}
          {isLoadingAutomation && (
            <div className="loading-indicator">
              <p>Processing image...</p>
              {/* Add a spinner component here if you want */}
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          
          {latestPetition && (
            <div className="petition-info">
              <h3>Current Petition: {latestPetition}</h3>
            </div>
          )}

          {processedData?.uploaded_image_url && (
            <div className="original-image">
              <h3>Uploaded Image</h3>
              <img src={processedData.uploaded_image_url} alt="Original" />
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={handleInsertAllAutomationData}
              className="btn-insert"
              disabled={!latestPetition || isLoadingAutomation || !processedData?.chunks}
            >
              {isLoadingAutomation ? "Processing..." : "Process All Chunks"}
            </button>
          </div>
          
          {processedData?.chunks && (
            <div className="chunks-grid">
              {processedData.chunks.map((chunk) => (
                <ChunkDisplay
                  key={chunk.chunk_number}
                  chunk={chunk}
                  onFetchAutomation={fetchAutomationData}
                  isLoading={isLoadingAutomation}
                  latestPetition={latestPetition}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="right-panel">
          <SearchForm onSearch={handleGlobalSearch} />
          <div className="search-results">
            <div className="search-header">
              <h3>Search Results</h3>
              {searchResults.length > 0 && (
                <button 
                  className="screenshot-button primary"
                  onClick={() => saveSearchResultScreenshot(searchResults, searchInfo.searchCriteria, `signature-${searchInfo.searchCriteria.method}-match-${new Date().toISOString().replace(/[:.]/g, '-')}.png`)}
                >
                  📸 Save Screenshot
                </button>
              )}
            </div>
            {searchLoading && <p>Loading results...</p>}
            {searchError && <p className="error">{searchError}</p>}
            {!searchLoading && !searchError && (
              <div className="results-container">
                {searchResults.length === 0 ? (
                  <div className="no-results">
                    <div className="search-details">
                      <h3>Search Details</h3>
                      <p><strong>Date & Time:</strong> {searchInfo.searchTime?.toLocaleString()}</p>
                      <p><strong>Search Method:</strong> {method ? SEARCH_METHODS[method].label : 'No method selected'}</p>
                      <p><strong>Search Criteria:</strong></p>
                      <ul>
                        {Object.entries(searchInfo.searchCriteria).map(([key, value]) => (
                          value && <li key={key}><strong>{key}:</strong> {value}</li>
                        ))}
                      </ul>
                      <p><strong>Result:</strong> No matches found</p>
                    </div>
                    <button 
                      className="screenshot-button"
                      onClick={() => saveSearchResultScreenshot(searchResults, searchInfo.searchCriteria, `signature-${searchInfo.searchCriteria.method}-no-match-${new Date().toISOString().replace(/[:.]/g, '-')}.png`)}
                    >
                      Save Screenshot (No Match)
                    </button>
                  </div>
                ) : (
                  <div className="result-list">
                    <div className="search-details">
                      <h3>Search Details</h3>
                      <p><strong>Date & Time:</strong> {searchInfo.searchTime?.toLocaleString()}</p>
                      <p><strong>Search Method:</strong> {method ? SEARCH_METHODS[method].label : 'No method selected'}</p>
                      <p><strong>Search Criteria:</strong></p>
                      <ul>
                        {Object.entries(searchInfo.searchCriteria).map(([key, value]) => (
                          value && <li key={key}><strong>{key}:</strong> {value}</li>
                        ))}
                      </ul>
                      <p><strong>Results Found:</strong> {searchResults.length}</p>
                    </div>
                    {searchResults.map((result, index) => (
                      <div key={index} className="result-item">
                        <h3>Match #{index + 1}</h3>
                        <ul>
                          <li><strong>First Name:</strong> {result.first_name}</li>
                          <li><strong>Last Name:</strong> {result.last_name}</li>
                          <li><strong>Address:</strong> {result.address}</li>
                          <li><strong>Zip Code:</strong> {result.zip_code}</li>
                        </ul>
                      </div>
                    ))}
                    <button 
                      className="screenshot-button"
                      onClick={() => saveSearchResultScreenshot(searchResults, searchInfo.searchCriteria, `signature-${searchInfo.searchCriteria.method}-match-${new Date().toISOString().replace(/[:.]/g, '-')}.png`)}
                    >
                      Save Screenshot (Match Found)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ChatInterface user={user} />
    </div>
  );
};

CombinedPage.propTypes = {
  user: PropTypes.object
};

export default CombinedPage;