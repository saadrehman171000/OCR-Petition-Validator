import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminView = ({ activeCollection, onSelectItem }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      setData([]); // Clear previous data when switching collections

      try {
        const response = await axios.get(`http://localhost:5000/api/${activeCollection}`);
        if (response.data[activeCollection]) {
          setData(response.data[activeCollection]);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCollection]);

  const renderTable = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!data || data.length === 0) return <p className="no-data-message">No data available</p>;

    const headers = Object.keys(data[0]);

    return (
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} onClick={() => onSelectItem(item)} style={{ cursor: "pointer" }}>
              {headers.map((header) => (
                <td key={`${index}-${header}`}>
                  {typeof item[header] === "object" && item[header] !== null
                    ? JSON.stringify(item[header])
                    : item[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return <div>{renderTable()}</div>;
};

export default AdminView;
