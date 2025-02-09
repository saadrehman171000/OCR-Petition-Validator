import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";
import "./SearchPage.css";

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResultsFound, setNoResultsFound] = useState(false);
  const navigate = useNavigate();

  const handleSearchResults = (data) => {
    setLoading(false);
    if (data.error) {
      setError(data.error);
      setResults([]);
    } else {
      setError(null);
      setResults(data.results);

      if (data.results.length === 0) {
        setNoResultsFound(true);
      } else {
        setNoResultsFound(false);
      }
    }
  };

  const handleSearch = async (params) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setNoResultsFound(false);

    try {
      const url = new URL('http://localhost:5000/api/search');
      Object.keys(params).forEach((key) => {
        if (params[key]) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url, {
        method: 'GET', // Make GET request
      });

      const data = await response.json();
      handleSearchResults(data);
    } catch (error) {
      setError("An error occurred while searching");
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="search-page">
      <div className="left-column">
        <h1>Search for a Petition</h1>
        <SearchForm onSearch={handleSearch} />
      </div>
      <div className="right-column">
        <h2>Search Results</h2>
        <div className="results-container">
          {loading && <p className="loading">Loading results...</p>}
          {error && <p className="error">{error}</p>}
          {noResultsFound && (
            <p className="no-results-alert">
              No results found. Please try another method.
            </p>
          )}
          {!loading && !error && results.length === 0 && !noResultsFound && (
            <p className="no-results">No results found</p>
          )}
          {results.length > 0 && (
            <div className="result-list">
              {results.map((result, index) => (
                <div key={index} className="result-item">
                  <h3>Chunk {result.chunk_number}</h3>
                  <strong>OCR Data:</strong>
                  <ul>
                    <li>First Name: {result.first_name}</li>
                    <li>Last Name: {result.last_name}</li>
                    <li>Address: {result.address}</li>
                    <li>Zip Code: {result.zip_code}</li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="go-back-button" onClick={handleGoBack}>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default SearchPage;