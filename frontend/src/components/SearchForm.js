import React, { useState, useEffect } from "react";

const SEARCH_METHODS = {
  "method1": {
    label: "First Initial + Last Initial Search",
    description: "First letter of First Name + First letter of Last Name + Street Number + First letter of Street Name + ZIP Code"
  },
  "method2": {
    label: "First Initial + Full Last Name Search",
    description: "First letter of First Name + Full Last Name + First letter of Street Name + ZIP Code"
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

const SearchForm = ({ onSearch, initialData = null }) => {
  const [method, setMethod] = useState("");
  const [formData, setFormData] = useState(initialData || {
    first_name: "",
    last_initial: "",
    street_number: "",
    street_initial: "",
    zip_code: "",
    address_number: "",
    street_name: "",
    last_name: "",
    first_initial: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const params = { ...formData, method };

    // Remove empty fields
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });

    onSearch(params);
  };

  const renderFields = () => {
    const fields = [];
    
    switch (method) {
      case "method1":
        fields.push(
          <div key="first_name" className="search-form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter first letter only"
            />
          </div>,
          <div key="last_initial" className="search-form-group">
            <label>First Letter of Last Name:</label>
            <input
              type="text"
              name="last_initial"
              value={formData.last_initial}
              onChange={handleInputChange}
              placeholder="Enter first letter only"
            />
          </div>,
          <div key="street_number" className="search-form-group">
            <label>Street Number:</label>
            <input
              type="text"
              name="street_number"
              value={formData.street_number}
              onChange={handleInputChange}
            />
          </div>,
          <div key="street_initial" className="search-form-group">
            <label>First Letter of Street Name:</label>
            <input
              type="text"
              name="street_initial"
              value={formData.street_initial}
              onChange={handleInputChange}
              placeholder="Enter first letter only"
            />
          </div>,
          <div key="zip_code" className="search-form-group">
            <label>ZIP Code:</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
            />
          </div>
        );
        break;

      case "method2":
        fields.push(
          <div key="first_name" className="search-form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter first letter only"
            />
          </div>,
          <div key="last_name" className="search-form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
            />
          </div>,
          <div key="street_initial" className="search-form-group">
            <label>First Letter of Street Name:</label>
            <input
              type="text"
              name="street_initial"
              value={formData.street_initial}
              onChange={handleInputChange}
              placeholder="Enter first letter only"
            />
          </div>,
          <div key="zip_code" className="search-form-group">
            <label>ZIP Code:</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
            />
          </div>
        );
        break;

      case "method3":
        fields.push(
          <div key="first_name" className="search-form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="Enter full first name"
            />
          </div>,
          <div key="last_name" className="search-form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Enter full last name"
            />
          </div>,
          <div key="street_number" className="search-form-group">
            <label>Street Number:</label>
            <input
              type="text"
              name="street_number"
              value={formData.street_number}
              onChange={handleInputChange}
              placeholder="Enter street number"
            />
          </div>,
          <div key="street_name" className="search-form-group">
            <label>Street Name:</label>
            <input
              type="text"
              name="street_name"
              value={formData.street_name}
              onChange={handleInputChange}
              placeholder="Enter street name"
            />
          </div>,
          <div key="zip_code" className="search-form-group">
            <label>ZIP Code:</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP code"
            />
          </div>
        );
        break;

      case "method4":
        fields.push(
          <div key="first_name" className="search-form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
            />
          </div>,
          <div key="last_name" className="search-form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
            />
          </div>,
          <div key="address_number" className="search-form-group">
            <label>Address Number:</label>
            <input
              type="text"
              name="address_number"
              value={formData.address_number}
              onChange={handleInputChange}
            />
          </div>,
          <div key="street_name" className="search-form-group">
            <label>Street Name:</label>
            <input
              type="text"
              name="street_name"
              value={formData.street_name}
              onChange={handleInputChange}
            />
          </div>,
          <div key="zip_code" className="search-form-group">
            <label>ZIP Code:</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
            />
          </div>
        );
        break;

      case "method5":
        fields.push(
          <div key="street_number" className="search-form-group">
            <label>Street Number:</label>
            <input
              type="text"
              name="street_number"
              value={formData.street_number}
              onChange={handleInputChange}
            />
          </div>,
          <div key="street_name" className="search-form-group">
            <label>Street Name:</label>
            <input
              type="text"
              name="street_name"
              value={formData.street_name}
              onChange={handleInputChange}
            />
          </div>,
          <div key="zip_code" className="search-form-group">
            <label>ZIP Code:</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleInputChange}
            />
          </div>
        );
        break;

      default:
        return null;
    }
    
    return fields;
  };

  return (
    <div className="search-container">
      <div className="search-method">
        <label>Search Method:</label>
        <select 
          value={method} 
          onChange={(e) => setMethod(e.target.value)}
          className="search-select"
        >
          <option value="">Select a Search Method</option>
          {Object.entries(SEARCH_METHODS).map(([key, {label}]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {method && (
          <div className="method-description">
            {SEARCH_METHODS[method].description}
          </div>
        )}
      </div>
      <form onSubmit={handleSearch} className="search-form">
        {method && (
          <div className="search-form-fields">
            {renderFields()}
          </div>
        )}
        <button 
          type="submit" 
          className="search-button"
          disabled={!method}
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
