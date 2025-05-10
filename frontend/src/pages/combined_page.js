"use client"

import { useState, useEffect, useMemo } from "react"
import PropTypes from "prop-types"
import SearchForm from "../components/SearchForm"
import axios from "axios"
import "./combined_page.css"
import { io } from "socket.io-client"

const ChunkDisplay = ({ chunk, onFetchAutomation, isLoading, latestPetition, saveSearchResultScreenshot }) => {
  const [editableData, setEditableData] = useState(chunk.ocr_data)
  const [searchResults, setSearchResults] = useState(null)
  const [processStatus, setProcessStatus] = useState("idle")
  const [processError, setProcessError] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [scrapingResult, setScrapingResult] = useState(null)
  const [scrapingStatus, setScrapingStatus] = useState("idle")
  const [isExpanded, setIsExpanded] = useState(false)
  const [classificationStatus, setClassificationStatus] = useState(null)
  const [classificationLoading, setClassificationLoading] = useState(false)

  const handleDataEdit = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getSearchParams = (method, data) => {
    switch (method) {
      case "method1":
        return {
          first_name: data.first_name || "",
          last_initial: data.last_name?.[0] || "",
          street_number: data.address?.split(" ")[0] || "",
          street_initial: data.address?.split(" ")[1]?.[0] || "",
          zip_code: data.zip_code,
          method: method,
          chunk_number: chunk.chunk_number,
          petition: latestPetition,
        }
      case "method2":
        return {
          first_initial: data.first_name?.[0] || "",
          last_name: data.last_name,
          street_initial: data.address?.split(" ")[1]?.[0] || "",
          zip_code: data.zip_code,
          method: method,
          chunk_number: chunk.chunk_number,
          petition: latestPetition,
        }
      case "method3":
        return {
          first_name: data.first_name,
          last_name: data.last_name,
          street_number: data.address?.split(" ")[0] || "",
          street_initial: data.address?.split(" ")[1]?.[0] || "",
          zip_code: data.zip_code,
          method: method,
          chunk_number: chunk.chunk_number,
          petition: latestPetition,
        }
      case "method4":
        return {
          first_name: data.first_name,
          last_name: data.last_name,
          address: data.address,
          zip_code: data.zip_code,
          method: method,
          chunk_number: chunk.chunk_number,
          petition: latestPetition,
        }
      case "method5":
        return {
          street_number: data.address?.split(" ")[0] || "",
          street_name: data.address?.split(" ").slice(1).join(" ") || "",
          zip_code: data.zip_code,
          method: method,
          chunk_number: chunk.chunk_number,
          petition: latestPetition,
        }
      default:
        return {
          ...data,
          chunk_number: chunk.chunk_number,
          petition: latestPetition,
        }
    }
  }

  const handleSearch = async (searchParams) => {
    try {
      setProcessStatus("loading")
      setProcessError(null)
      setIsSearching(true)

      // Call the automation endpoint
      const response = await axios.post("http://localhost:5000/api/process-single-signature", searchParams)

      if (response.data.success) {
        setScrapingResult(response.data)
        setScrapingStatus(response.data.found ? "found" : "not-found")
        setIsExpanded(true) // Auto-expand when results come in
      } else {
        setProcessError(response.data.message)
      }
    } catch (error) {
      setProcessStatus("error")
      setProcessError(error.message)
    } finally {
      setIsSearching(false)
    }
  }

  // Add these helper functions
  const getStreetNumber = (address) => {
    if (!address) return '';
    const match = address.match(/^\d+/);
    return match ? match[0] : '';
  };

  const getStreetName = (address) => {
    if (!address) return '';
    const words = address.split(' ');
    return words.length > 1 ? words.slice(1).join(' ') : '';
  };

  // Then modify the search handler functions
  const handleStreetCentricSearch = () => {
    try {
      setProcessStatus("loading")
      setProcessError(null)
      setIsSearching(true)

      // Split address into street number and street name
      const addressParts = editableData.address?.split(' ') || [];
      const streetNumber = addressParts[0] || '';
      const streetName = addressParts.slice(1).join(' ');
      const streetFirstLetter = streetName.charAt(0) || '';

      // Extract and format the search parameters according to requirements
      const searchParams = {
        first_name: editableData.first_name?.slice(0, 3) || '',
        last_name: editableData.last_name?.slice(0, 3) || '',
        address: `${streetNumber} ${streetFirstLetter}`, // Combine street number and first letter
        zip_code: editableData.zip_code || '',
        method: 'streetCentric',
        chunk_number: chunk.chunk_number,
        petition: latestPetition
      };

      console.log('Street Centric Search Params:', searchParams); // Add this for debugging
      handleSearch(searchParams);
    } catch (error) {
      setProcessStatus("error")
      setProcessError(error.message)
      setIsSearching(false)
    }
  };

  const handleNameCentricSearch = () => {
    try {
      setProcessStatus("loading")
      setProcessError(null)
      setIsSearching(true)

      // Split address into street number and street name
      const addressParts = editableData.address?.split(' ') || [];
      const streetNumber = addressParts[0] || '';
      const streetName = addressParts.slice(1).join(' ');
      const streetFirstThreeLetters = streetName.slice(0, 3) || '';

      // Extract and format the search parameters according to requirements
      const searchParams = {
        first_name: editableData.first_name?.charAt(0) || '',
        last_name: editableData.last_name?.charAt(0) || '',
        address: `${streetNumber} ${streetFirstThreeLetters}`, // Combine street number and first three letters
        zip_code: editableData.zip_code || '',
        method: 'nameCentric',
        chunk_number: chunk.chunk_number,
        petition: latestPetition
      };

      console.log('Name Centric Search Params:', searchParams); // Add this for debugging
      handleSearch(searchParams);
    } catch (error) {
      setProcessStatus("error")
      setProcessError(error.message)
      setIsSearching(false)
    }
  };

  const handlePerfectSearch = () => {
    try {
      setProcessStatus("loading")
      setProcessError(null)
      setIsSearching(true)

      const searchParams = {
        first_name: editableData.first_name || '',
        last_name: editableData.last_name || '',
        address: editableData.address || '',
        zip_code: editableData.zip_code || '',
        method: 'perfect',
        chunk_number: chunk.chunk_number,
        petition: latestPetition
      };

      handleSearch(searchParams);
    } catch (error) {
      setProcessStatus("error")
      setProcessError(error.message)
      setIsSearching(false)
    }
  };

  // Add useEffect for socket connection
  useEffect(() => {
    const socket = io("http://localhost:5000")

    socket.on("chunk_processed", (data) => {
      if (data.chunk_number === chunk.chunk_number) {
        setScrapingResult(data.result)
        setScrapingStatus(data.result.found ? "found" : "not-found")
        setIsExpanded(true) // Auto-expand when results come in
      }
    })

    return () => socket.disconnect()
  }, [chunk.chunk_number])

  const handleClassification = async (value) => {
    try {
      setClassificationLoading(true)
      const response = await axios.post('http://localhost:5000/api/update-spreadsheet', {
        value: value,
        chunkNumber: chunk.chunk_number,
        petition: latestPetition,
        timestamp: new Date().toISOString()
      })

      if (response.data.success) {
        setClassificationStatus({
          type: 'success',
          message: `Signature marked as ${value}`,
          data: response.data
        })
      } else {
        setClassificationStatus({
          type: 'error',
          message: 'Failed to update classification'
        })
      }
    } catch (error) {
      console.error('Classification error:', error)
      setClassificationStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to update classification'
      })
    } finally {
      setClassificationLoading(false)
    }
  }

  return (
    <div className={`chunk-container ${processStatus} fade-in`}>
      <div className="chunk-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Signature {chunk.chunk_number}</h3>
        <button className="expand-button">{isExpanded ? "▲" : "▼"}</button>
      </div>

      {isExpanded && (
        <div className="chunk-content slide-down">
          <div className="chunk-data-container">
            <div className="chunk-image">
              <img src={chunk.image_url || "/placeholder.svg"} alt={`Chunk ${chunk.chunk_number}`} />
            </div>

            <div className="chunk-data">
              <div className="editable-fields">
                {Object.entries(editableData).map(
                  ([field, value]) =>
                    field !== "raw_ocr_text" &&
                    field !== "full_name" && (
                      <div key={field} className="editable-field">
                        <label>{field.replace("_", " ")}:</label>
                        <input
                          type="text"
                          value={value || ""}
                          onChange={(e) => handleDataEdit(field, e.target.value)}
                          placeholder={`Enter ${field.replace("_", " ")}`}
                        />
                      </div>
                    ),
                )}
              </div>

              {/* Search Method Selection (Optional) */}
              <div className="search-buttons">
                <button 
                  onClick={handleStreetCentricSearch}
                  className="search-button street-centric"
                  disabled={isSearching}
                >
                  Street Centric Search
                </button>
                
                <button 
                  onClick={handleNameCentricSearch}
                  className="search-button name-centric"
                  disabled={isSearching}
                >
                  Name Centric Search
                </button>
              </div>

              {/* Rename the simple search button to Perfect Match Search */}
              <button 
                onClick={() => {
                  // Create search parameters from current editableData
                  const searchParams = {
                    first_name: editableData.first_name || '',
                    last_name: editableData.last_name || '',
                    address: editableData.address || '',
                    zip_code: editableData.zip_code || '',
                    method: 'simple',
                    chunk_number: chunk.chunk_number,
                    petition: latestPetition
                  };
                  handleSearch(searchParams);
                }} 
                disabled={isSearching} 
                className="search-button perfect-match"
              >
                {isSearching ? (
                  <>
                    <span className="spinner"></span>
                    Searching...
                  </>
                ) : (
                  <>Perfect Match Search</>
                )}
              </button>

              {/* Search Results Display */}
              {scrapingResult?.data && (
                <div className="search-results fade-in">
                  <div className="search-details">
                    <h3>Search Details</h3>
                    <p>
                      <strong>Date & Time:</strong> {new Date().toLocaleString()}
                    </p>
                    <p>
                      <strong>Search Criteria:</strong>
                    </p>
                    <ul>
                      {Object.entries(editableData).map(
                        ([key, value]) =>
                          value && (
                            <li key={key}>
                              <strong>{key.replace("_", " ")}:</strong> {value}
                            </li>
                          ),
                      )}
                    </ul>
                    <p>
                      <strong>Results Found:</strong> {scrapingResult.data.length || 0}
                    </p>
                  </div>

                  {scrapingResult.data.length > 0 &&
                    scrapingResult.data.map((result, index) => (
                      <div key={index} className="match-card slide-in">
                        <h5>Match #{index + 1}</h5>
                        <div className="match-details">
                          <div className="detail-row">
                            <span className="detail-label">Name:</span>
                            <span className="detail-value">{result[0]}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Address:</span>
                            <span className="detail-value">{result[1]}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Zip:</span>
                            <span className="detail-value">{result[2]}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Status:</span>
                            <span className="detail-value">{result[3]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {processError && <div className="error-message fade-in">{processError}</div>}
            </div>

            {/* Add Scraping Results Display */}
            <div className="scraping-results-container">
              {scrapingStatus === "idle" && (
                <div className="status-badge pending">
                  <span className="status-icon">⏳</span>
                  Waiting for processing...
                </div>
              )}

              {scrapingStatus === "found" && scrapingResult?.data && (
                <div className="status-badge success fade-in">
                  <h4>
                    <span className="status-icon">✅</span> Match Found!
                  </h4>
                  <div className="matches-list">
                    {scrapingResult.data.map((match, idx) => (
                      <div key={idx} className="match-item slide-in">
                        <p>
                          <strong>Name:</strong> {match[0]}
                        </p>
                        <p>
                          <strong>Address:</strong> {match[1]}
                        </p>
                        <p>
                          <strong>Zip:</strong> {match[2]}
                        </p>
                        <p>
                          <strong>Status:</strong> {match[3]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scrapingStatus === "not-found" && (
                <div className="status-badge error fade-in">
                  <span className="status-icon">❌</span> No Match Found
                </div>
              )}

              {/* Add Screenshot Display */}
              {scrapingResult?.screenshot_url && (
                <div className="search-screenshot-container fade-in">
                  <div className="search-screenshot">
                    <h4>Search Results Screenshot</h4>
                    <img
                      src={`http://localhost:5000${scrapingResult.screenshot_url}`}
                      alt={`Search results for chunk ${chunk.chunk_number}`}
                      className="search-result-image"
                      onError={(e) => {
                        console.error("Failed to load screenshot")
                        e.target.style.display = "none"
                        e.target.parentElement.innerHTML = "Failed to load screenshot"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Add classification buttons after scraping results */}
            <div className="classification-controls">
              <h4>Signature Classification</h4>
              <div className="classification-buttons">
                <button 
                  onClick={() => handleClassification('1')}
                  className="classification-btn good"
                  disabled={classificationLoading}
                >
                  GOOD (1)
                </button>
                <button 
                  onClick={() => handleClassification('0.1')}
                  className="classification-btn bad"
                  disabled={classificationLoading}
                >
                  BAD (0.1)
                </button>
                <button 
                  onClick={() => handleClassification('DUP')}
                  className="classification-btn dup"
                  disabled={classificationLoading}
                >
                  DUP
                </button>
                <button 
                  onClick={() => handleClassification('X')}
                  className="classification-btn purge"
                  disabled={classificationLoading}
                >
                  PURGE (X)
                </button>
                <button 
                  onClick={() => handleClassification('V')}
                  className="classification-btn voter"
                  disabled={classificationLoading}
                >
                  VOTER (V)
                </button>
              </div>

              {classificationLoading && (
                <div className="classification-status loading">
                  Updating spreadsheet...
                </div>
              )}

              {classificationStatus && (
                <div className={`classification-status ${classificationStatus.type}`}>
                  {classificationStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SpreadsheetManager = ({ petition, chunkNumber }) => {
  const [spreadsheetData, setSpreadsheetData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClassification = async (classification) => {
    try {
      setIsLoading(true)
      const response = await axios.post('/api/update-spreadsheet', {
        petition,
        chunkNumber,
        classification,
        timestamp: new Date().toISOString()
      })
      
      if (response.data.success) {
        setSpreadsheetData(response.data.spreadsheetData)
      } else {
        setError('Failed to update spreadsheet')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="spreadsheet-controls">
      <div className="classification-buttons">
        <button 
          onClick={() => handleClassification('VALID')}
          className="btn-valid"
          disabled={isLoading}
        >
          Valid (1)
        </button>
        <button 
          onClick={() => handleClassification('INVALID')}
          className="btn-invalid"
          disabled={isLoading}
        >
          Invalid (0.1)
        </button>
        <button 
          onClick={() => handleClassification('DUPLICATE')}
          className="btn-duplicate"
          disabled={isLoading}
        >
          Duplicate
        </button>
        <button 
          onClick={() => handleClassification('PURGE')}
          className="btn-purge"
          disabled={isLoading}
        >
          Purge (X)
        </button>
        <button 
          onClick={() => handleClassification('VOTER_VALIDATED')}
          className="btn-voter"
          disabled={isLoading}
        >
          Voter Validated (V)
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-spinner">Updating spreadsheet...</div>}
      
      {spreadsheetData && (
        <div className="spreadsheet-summary">
          <h4>Current Totals</h4>
          <p>Valid Signatures: {spreadsheetData.validCount}</p>
          <p>Invalid Signatures: {spreadsheetData.invalidCount}</p>
          <p>Duplicates: {spreadsheetData.duplicateCount}</p>
          <p>Purged: {spreadsheetData.purgeCount}</p>
          <p>Total Amount: ${spreadsheetData.totalAmount}</p>
        </div>
      )}
    </div>
  )
}

const CombinedPage = ({ user }) => {
  const [image, setImage] = useState(null)
  const [processedData, setProcessedData] = useState(null)
  const [error, setError] = useState(null)
  const [automationData, setAutomationData] = useState(null)
  const [isLoadingAutomation, setIsLoadingAutomation] = useState(false)
  const [latestPetition, setLatestPetition] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [method, setMethod] = useState("")
  const [searchInfo, setSearchInfo] = useState({
    searchTime: null,
    searchCriteria: {},
    searchMethod: "",
  })

  // Add this state for managing multiple files
  const [selectedFiles, setSelectedFiles] = useState([])
  const [processingStatus, setProcessingStatus] = useState({})
  const [currentBatchProgress, setCurrentBatchProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload") // 'upload' or 'search'

  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const newSocket = io("http://localhost:5000")
    setSocket(newSocket)

    newSocket.on("chunk_processed", (data) => {
      const { chunk_number, result } = data
      setProcessedData((prevData) => {
        if (!prevData?.chunks) return prevData

        const updatedChunks = prevData.chunks.map((chunk) => {
          if (chunk.chunk_number === chunk_number) {
            return {
              ...chunk,
              scraping_result: result,
            }
          }
          return chunk
        })

        return {
          ...prevData,
          chunks: updatedChunks,
        }
      })
    })

    return () => newSocket.disconnect()
  }, [])

  useEffect(() => {
    // Cleanup function
    return () => {
      setLatestPetition(null)
      setProcessedData(null)
      setImage(null)
      setError(null)
      setAutomationData(null)
    }
  }, [])

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        // Clear previous data
        setImage(null)
        setProcessedData(null)
        setError(null)
        setAutomationData(null)
        setLatestPetition(null) // Clear the current petition

        // Set new image
        setImage(file)

        // Get latest petition number first
        const petitionResponse = await axios.get("http://localhost:5000/api/latest-petition")
        const newPetition = petitionResponse.data.latest_petition
        setLatestPetition(newPetition)

        // Then process the image
        const formData = new FormData()
        formData.append("file", file)
        formData.append("petition", newPetition)

        setIsLoadingAutomation(true)

        const response = await axios.post("http://localhost:5000/api/process-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        if (response.data.error) {
          throw new Error(response.data.error)
        }

        setProcessedData(response.data)
      } catch (error) {
        console.error("Error processing image:", error)
        setError(error.response?.data?.error || "Error processing image")
      } finally {
        setIsLoadingAutomation(false)
      }
    }
  }

  const handleGlobalSearch = async (params) => {
    setSearchLoading(true)
    setSearchError(null)
    setSearchResults([])

    setSearchInfo({
      searchTime: new Date(),
      searchCriteria: params,
      searchMethod: params.method,
    })

    try {
      const response = await axios.get("http://localhost:5000/api/search", {
        params: params,
      })

      if (response.data.error) {
        setSearchError(response.data.error)
      } else {
        setSearchResults(response.data.results)
      }
    } catch (error) {
      setSearchError("An error occurred while searching")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleProcessPetition = async (chunkData) => {
    if (!latestPetition) throw new Error("No petition number available")

    try {
      const response = await axios.post("http://localhost:5000/api/process-petition", {
        first_name: chunkData.ocr_data.first_name,
        last_name: chunkData.ocr_data.last_name,
        address: chunkData.ocr_data.address,
        zip_code: chunkData.ocr_data.zip_code,
        petition: latestPetition,
      })

      if (!response.data) throw new Error("No response data received")
      return response.data
    } catch (error) {
      throw new Error(`Failed to process petition: ${error.message}`)
    }
  }

  const fetchAutomationData = async (chunkData) => {
    setIsLoadingAutomation(true)
    setError(null)

    try {
      const petitionData = await handleProcessPetition(chunkData)
      if (!petitionData.data) throw new Error("Invalid petition data received")

      setAutomationData((prevData) => ({
        ...prevData,
        [chunkData.chunk_number]: petitionData.data,
      }))

      return petitionData
    } catch (error) {
      setError(`Automation failed: ${error.message}`)
      throw error
    } finally {
      setIsLoadingAutomation(false)
    }
  }

  const handleInsertAllAutomationData = async () => {
    if (!processedData?.chunks) return

    setIsLoadingAutomation(true)
    try {
      const chunksData = processedData.chunks.map((chunk) => ({
        ...chunk,
        petition: latestPetition,
        image_url: chunk.image_url,
      }))

      const response = await axios.post("http://localhost:5000/api/insert-all-automation-data", {
        chunks: chunksData,
        petition: latestPetition,
        batch_id: processedData.batch_id,
      })

      if (response.data.success) {
        setAutomationData(response.data.results)
        // Show success notification
        const notification = document.createElement("div")
        notification.className = "success-notification"
        notification.textContent = "Successfully processed all chunks!"
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.classList.add("show")
          setTimeout(() => {
            notification.classList.remove("show")
            setTimeout(() => {
              document.body.removeChild(notification)
            }, 300)
          }, 3000)
        }, 100)
      }
    } catch (error) {
      setError(`Failed to process all chunks: ${error.message}`)
    } finally {
      setIsLoadingAutomation(false)
    }
  }

  // Modify the file input handler
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 100) {
      alert("Maximum 100 files can be uploaded at once")
      return
    }
    setSelectedFiles(files)
    setProcessingStatus({}) // Reset processing status
    setCurrentBatchProgress(0)
  }

  // Update the handleProcessBatch function
  const handleProcessBatch = async () => {
    if (selectedFiles.length === 0) return

    setIsLoadingAutomation(true)
    setCurrentBatchProgress(0)
    setProcessedData(null) // Reset processed data

    try {
      // Get latest petition number first
      const petitionResponse = await axios.get("http://localhost:5000/api/latest-petition")
      const newPetition = petitionResponse.data.latest_petition
      setLatestPetition(newPetition)

      const allProcessedData = []

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("petition", newPetition)

        try {
          setProcessingStatus((prev) => ({
            ...prev,
            [file.name]: "processing",
          }))

          const response = await axios.post("http://localhost:5000/api/process-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })

          setProcessingStatus((prev) => ({
            ...prev,
            [file.name]: "completed",
          }))

          // Add the processed data to our array
          allProcessedData.push({
            fileName: file.name,
            ...response.data,
          })
        } catch (error) {
          setProcessingStatus((prev) => ({
            ...prev,
            [file.name]: "error",
          }))
          console.error(`Error processing ${file.name}:`, error)
        }

        setCurrentBatchProgress(((i + 1) / selectedFiles.length) * 100)
      }

      // Update processed data with all results
      setProcessedData({
        files: allProcessedData,
        uploaded_image_urls: allProcessedData.map((data) => data.uploaded_image_url),
        chunks: allProcessedData.flatMap((data) => data.chunks || []),
      })
    } catch (error) {
      console.error("Error processing batch:", error)
      setError("Error processing batch: " + error.message)
    } finally {
      setIsLoadingAutomation(false)
    }
  }

  // Move the saveSearchResultScreenshot function here
  const saveSearchResultScreenshot = async (results, searchParams, filename) => {
    try {
      const resultsElement = document.querySelector(".search-results")
      if (!resultsElement) {
        throw new Error("Search results element not found")
      }

      // Import html2canvas dynamically
      const html2canvas = (await import("html2canvas")).default

      // Add a temporary class for screenshot
      resultsElement.classList.add("taking-screenshot")

      // Take the screenshot
      const canvas = await html2canvas(resultsElement, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      })

      // Remove the temporary class
      resultsElement.classList.remove("taking-screenshot")

      // Convert and download
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = filename
      link.href = image
      link.click()
    } catch (error) {
      console.error("Screenshot failed:", error)
      alert("Failed to save screenshot: " + error.message)
    }
  }

  // Pass saveSearchResultScreenshot to ChunkDisplay
  const renderChunkDisplay = (chunk, fileIndex, chunkIndex) => (
    <ChunkDisplay
      key={`${fileIndex}-${chunkIndex}`}
      chunk={chunk}
      onFetchAutomation={fetchAutomationData}
      isLoading={isLoadingAutomation}
      latestPetition={latestPetition}
      saveSearchResultScreenshot={saveSearchResultScreenshot}
    />
  )

  if (!user) {
    return (
      <div className="login-required">
        <div className="login-warning">
          <div className="login-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>Please log in to access this page.</p>
          <button onClick={() => (window.location.href = "/login")} className="login-button">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="combined-page">
      <div className="page-header">
        <h1>Petition Processing System</h1>
        <div className="user-info">
          <span className="user-greeting">Welcome, {user.username}</span>
          <span className="user-type">{user.usertype}</span>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload & Process
        </button>
        <button
          className={`tab-button ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          Search Database
        </button>
      </div>

      <div className="main-grid">
        {activeTab === "upload" && (
          <div className="left-panel">
            <div className="upload-section">
              <div className="upload-container">
                <div 
                  className="upload-dropzone"
                  onClick={() => document.getElementById("file-input").click()}
                >
                  <div className="upload-icon">📁</div>
                  <p>Drag files here or click to browse</p>
                  <span className="upload-hint">Supports images of petitions</span>
                </div>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="file-input"
                  disabled={isLoadingAutomation}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="batch-info fade-in">
                  <h3>Selected Files ({selectedFiles.length})</h3>
                  <div className="selected-files-list">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div 
                        key={index} 
                        className={`selected-file-item ${processingStatus[file.name] || "pending"}`}
                      >
                        <span className="file-name">{file.name}</span>
                        <span className="status-indicator">
                          {processingStatus[file.name] === "completed" && "✅"}
                          {processingStatus[file.name] === "processing" && "⏳"}
                          {processingStatus[file.name] === "error" && "❌"}
                          {!processingStatus[file.name] && "⏱️"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleProcessBatch} 
                    className="process-batch-button" 
                    disabled={isLoadingAutomation}
                  >
                    {isLoadingAutomation ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      "Process Selected Files"
                    )}
                  </button>
                </div>
              )}
            </div>

            {image && (
              <div className="upload-info">
                <p>
                  Image uploaded: <span className="filename">{image.name}</span>
                </p>
              </div>
            )}

            {isLoadingAutomation && (
              <div className="loading-indicator">
                <div className="spinner-large"></div>
                <p>Processing image...</p>
              </div>
            )}

            {error && (
              <div className="error-message fade-in">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            {latestPetition && (
              <div className="petition-info fade-in">
                <h3>
                  Current Petition: <span className="petition-number">{latestPetition}</span>
                </h3>
              </div>
            )}

            {processedData?.uploaded_image_url && (
              <div className="original-image fade-in">
                <h3>Uploaded Image</h3>
                <div className="image-container">
                  <img src={processedData.uploaded_image_url || "/placeholder.svg"} alt="Original" />
                </div>
              </div>
            )}

            <div className="action-buttons fade-in">
              <button
                onClick={handleInsertAllAutomationData}
                className="btn-insert"
                disabled={!latestPetition || isLoadingAutomation || !processedData?.chunks}
              >
                {isLoadingAutomation ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>Process All Chunks</>
                )}
              </button>
            </div>

            {processedData?.chunks && (
              <div className="processed-results fade-in">
                <h3>Processed Results</h3>
                {processedData.files?.map((fileData, fileIndex) => (
                  <div key={fileIndex} className="file-results">
                    <h4 className="file-name">{fileData.fileName}</h4>
                    {fileData.chunks?.map((chunk, chunkIndex) => renderChunkDisplay(chunk, fileIndex, chunkIndex))}
                  </div>
                ))}

                {!processedData.files &&
                  processedData.chunks?.map((chunk, index) => renderChunkDisplay(chunk, 0, index))}
              </div>
            )}
          </div>
        )}

        {activeTab === "search" && (
          <div className="search-panel">
            <SearchForm onSearch={handleGlobalSearch} />
            <div className="search-results-panel">
              <div className="search-header">
                <h3>Search Results</h3>
                {searchResults.length > 0 && (
                  <button
                    className="screenshot-button primary"
                    onClick={() =>
                      saveSearchResultScreenshot(
                        searchResults,
                        searchInfo.searchCriteria,
                        `signature-${searchInfo.searchCriteria.method}-match-${new Date().toISOString().replace(/[:.]/g, "-")}.png`,
                      )
                    }
                  >
                    📸 Save Screenshot
                  </button>
                )}
              </div>

              {searchLoading && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Loading results...</p>
                </div>
              )}

              {searchError && (
                <div className="error-message fade-in">
                  <span className="error-icon">⚠️</span> {searchError}
                </div>
              )}

              {!searchLoading && !searchError && (
                <div className="results-container">
                  {searchResults.length === 0 ? (
                    <div className="no-results fade-in">
                      <div className="search-details">
                        <h3>Search Details</h3>
                        <p>
                          <strong>Date & Time:</strong> {searchInfo.searchTime?.toLocaleString()}
                        </p>
                        <p>
                          <strong>Search Method:</strong> {method ? SEARCH_METHODS[method].label : "No method selected"}
                        </p>
                        <p>
                          <strong>Search Criteria:</strong>
                        </p>
                        <ul>
                          {Object.entries(searchInfo.searchCriteria).map(
                            ([key, value]) =>
                              value && (
                                <li key={key}>
                                  <strong>{key}:</strong> {value}
                                </li>
                              ),
                          )}
                        </ul>
                        <p>
                          <strong>Result:</strong> No matches found
                        </p>
                      </div>
                      <button
                        className="screenshot-button"
                        onClick={() =>
                          saveSearchResultScreenshot(
                            searchResults,
                            searchInfo.searchCriteria,
                            `signature-${searchInfo.searchCriteria.method}-no-match-${new Date().toISOString().replace(/[:.]/g, "-")}.png`,
                          )
                        }
                      >
                        Save Screenshot (No Match)
                      </button>
                    </div>
                  ) : (
                    <div className="result-list fade-in">
                      <div className="search-details">
                        <h3>Search Details</h3>
                        <p>
                          <strong>Date & Time:</strong> {searchInfo.searchTime?.toLocaleString()}
                        </p>
                        <p>
                          <strong>Search Method:</strong> {method ? SEARCH_METHODS[method].label : "No method selected"}
                        </p>
                        <p>
                          <strong>Search Criteria:</strong>
                        </p>
                        <ul>
                          {Object.entries(searchInfo.searchCriteria).map(
                            ([key, value]) =>
                              value && (
                                <li key={key}>
                                  <strong>{key}:</strong> {value}
                                </li>
                              ),
                          )}
                        </ul>
                        <p>
                          <strong>Results Found:</strong> {searchResults.length}
                        </p>
                      </div>

                      {searchResults.map((result, index) => (
                        <div key={index} className="result-item slide-in">
                          <h3>Match #{index + 1}</h3>
                          <ul>
                            <li>
                              <strong>First Name:</strong> {result.first_name}
                            </li>
                            <li>
                              <strong>Last Name:</strong> {result.last_name}
                            </li>
                            <li>
                              <strong>Address:</strong> {result.address}
                            </li>
                            <li>
                              <strong>Zip Code:</strong> {result.zip_code}
                            </li>
                          </ul>
                        </div>
                      ))}

                      <button
                        className="screenshot-button"
                        onClick={() =>
                          saveSearchResultScreenshot(
                            searchResults,
                            searchInfo.searchCriteria,
                            `signature-${searchInfo.searchCriteria.method}-match-${new Date().toISOString().replace(/[:.]/g, "-")}.png`,
                          )
                        }
                      >
                        Save Screenshot (Match Found)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

CombinedPage.propTypes = {
  user: PropTypes.object,
}

export default CombinedPage

