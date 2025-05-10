"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import SearchForm from "../components/SearchForm"
import "./SearchPage.css"

const SearchPage = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [noResultsFound, setNoResultsFound] = useState(false)
  const [searchParams, setSearchParams] = useState({})
  const [searchTime, setSearchTime] = useState(null)
  const navigate = useNavigate()

  const handleSearchResults = (data) => {
    setLoading(false)
    if (data.error) {
      setError(data.error)
      setResults([])
    } else {
      setError(null)
      setResults(data.results)

      if (data.results.length === 0) {
        setNoResultsFound(true)
      } else {
        setNoResultsFound(false)
      }
    }
  }

  const handleSearch = async (params) => {
    setLoading(true)
    setError(null)
    setResults([])
    setNoResultsFound(false)
    setSearchParams(params)
    setSearchTime(new Date())

    try {
      const url = new URL("http://localhost:5000/api/search")
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          url.searchParams.append(key, params[key])
        }
      })

      const response = await fetch(url, {
        method: "GET", // Make GET request
      })

      const data = await response.json()
      handleSearchResults(data)
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred while searching")
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1) // Go back to the previous page
  }

  const saveScreenshot = async () => {
    try {
      const resultsContainer = document.querySelector(".results-container")
      if (!resultsContainer) {
        throw new Error("Results container not found")
      }

      // Import html2canvas dynamically
      const html2canvas = (await import("html2canvas")).default

      // Take the screenshot
      const canvas = await html2canvas(resultsContainer, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        logging: false,
      })

      // Convert and download
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `search-results-${new Date().toISOString().replace(/[:.]/g, "-")}.png`
      link.href = image
      link.click()
    } catch (error) {
      console.error("Screenshot failed:", error)
      alert("Failed to save screenshot: " + error.message)
    }
  }

  return (
    <div className="search-page fade-in">
      <div className="search-page-header">
        <h1>Petition Search</h1>
        <button className="back-button" onClick={handleGoBack}>
          ← Back
        </button>
      </div>

      <div className="search-page-content">
        <div className="left-column slide-in">
          <div className="search-form-container">
            <h2>Search for a Petition</h2>
            <p className="search-instructions">Enter search criteria below to find petition records in the database.</p>
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>

        <div className="right-column slide-in">
          <div className="results-header">
            <h2>Search Results</h2>
            {results.length > 0 && (
              <button className="screenshot-button" onClick={saveScreenshot}>
                📸 Save Screenshot
              </button>
            )}
          </div>

          <div className="results-container">
            {searchTime && (
              <div className="search-metadata">
                <p>
                  <strong>Search Time:</strong> {searchTime.toLocaleString()}
                </p>
                <div className="search-params">
                  <strong>Search Parameters:</strong>
                  <ul>
                    {Object.entries(searchParams).map(
                      ([key, value]) =>
                        value && (
                          <li key={key}>
                            <strong>{key}:</strong> {value}
                          </li>
                        ),
                    )}
                  </ul>
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading">Searching database...</p>
              </div>
            )}

            {error && (
              <div className="error-message fade-in">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            {noResultsFound && (
              <div className="no-results-alert fade-in">
                <div className="no-results-icon">🔍</div>
                <h3>No Results Found</h3>
                <p>Please try another search method or different criteria.</p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="result-list fade-in">
                <div className="results-summary">
                  <h3>
                    Found {results.length} Result{results.length !== 1 ? "s" : ""}
                  </h3>
                </div>

                {results.map((result, index) => (
                  <div key={index} className="result-item slide-in">
                    <div className="result-header">
                      <h3>Match #{index + 1}</h3>
                      {result.chunk_number && <span className="chunk-badge">Chunk {result.chunk_number}</span>}
                    </div>
                    <div className="result-content">
                      <div className="result-field">
                        <span className="field-label">First Name:</span>
                        <span className="field-value">{result.first_name || "N/A"}</span>
                      </div>
                      <div className="result-field">
                        <span className="field-label">Last Name:</span>
                        <span className="field-value">{result.last_name || "N/A"}</span>
                      </div>
                      <div className="result-field">
                        <span className="field-label">Address:</span>
                        <span className="field-value">{result.address || "N/A"}</span>
                      </div>
                      <div className="result-field">
                        <span className="field-label">Zip Code:</span>
                        <span className="field-value">{result.zip_code || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage

