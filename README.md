# Petition Validator Pro

A professional web application for validating and processing petition signatures with advanced OCR capabilities, automated data extraction, and Excel integration. Built for efficient petition management and verification.

## 🚀 Features

### 📝 Signature Processing
- **Automated Image Processing**
  - Intelligent signature extraction from petition pages
  - High-accuracy OCR using Google Cloud Vision API
  - Multi-signature support per page
  - Automatic field detection and data extraction

### ✅ Validation System
- **Four-Tier Validation**
  - GOOD (1.0): Valid signature
  - BAD (0.1): Invalid signature
  - DUP: Duplicate entry
  - PURGE: Entry to be removed
- **Real-time Excel Integration**
  - Automatic spreadsheet updates
  - Formula calculations
  - Running totals and statistics

### 🔍 Advanced Search Capabilities
- **Multiple Search Methods**
  1. First Initial + Last Initial Search
  2. First Initial + Full Last Name Search
  3. Full Name + Street Search
  4. Complete Address Search
  5. Street Only Search
- **Search Features**
  - Real-time results
  - Screenshot functionality
  - Duplicate detection
  - Match highlighting

### 📊 Data Management
- **Secure Storage**
  - MongoDB integration
  - Excel spreadsheet automation
  - Audit trail tracking
- **Automated Processing**
  - Batch signature processing
  - Automatic petition numbering
  - Data validation checks

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- HTML5 Canvas
- Modern CSS3

### Backend
- Flask (Python)
- Google Cloud Vision API
- MongoDB
- OpenPyXL

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB
- Google Cloud Vision API credentials
- Excel template file

## 🔧 Installation

1. **Clone the Repository**
```bash
git clone https://github.com/saadrehman171000/OCR-Petition-Validator
cd OCR-Petition-Validator
```

2. **Create Required Directories**
```bash
mkdir uploads processed_images screenshots data Excelsheet negative_results output static
```

3. **Backend Setup**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Frontend Setup**
```bash
cd frontend
npm install
```

5. **Environment Configuration**

Create `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_uri
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
FLASK_ENV=development
```

6. **Additional Setup**
- Place the Excel template file (`Copy of MASTER TEMPLATE.xlsx`) in the root directory
- Ensure ChromeDriver (`chromedriver.exe`) is in the root directory
- Configure ZIP code data using `zip_county.csv`

## 📁 Project Structure

```
OCR-Petition-Validator/
├── frontend/                # React frontend application
│   └── src/
│       ├── pages/
│       │   └── combined_page.js/css
│       └── components/
│           └── SearchForm.js
├── .chainlit/              # Chainlit configuration
├── data/                   # Data storage
├── dependencies/           # Project dependencies
├── Excelsheet/            # Excel templates and outputs
├── negative_results/       # Failed processing results
├── output/                # Generated outputs
├── processed_images/      # OCR processed images
├── screenshots/           # Search result screenshots
├── static/               # Static assets
├── uploads/              # Temporary upload storage
├── app.py               # Main Flask application
├── automation.py        # Automation logic
├── automation_helper.py # Automation utility functions
├── chainlit.md         # Chainlit documentation
├── check_excel.py      # Excel processing logic
├── check_petition.py   # Petition verification
├── constants.py        # Application constants
├── constants_helper.py # Constants utility functions
├── database_operations.py # Database operations
├── detection.py        # Image detection logic
├── fields.py          # Field definitions
├── helpers.py         # Utility functions
├── models.py          # Database models
├── text_extraction.py # Text extraction logic
├── requirements.txt   # Python dependencies
└── zip_county.csv    # ZIP code reference data
```

## 🔑 Key Features Explained

### Petition Processing
- Upload petition images
- Automatic signature extraction
- OCR data extraction
- Real-time validation

### Excel Integration
- Automatic cell updates
- Formula calculations
- Running totals
- Status tracking

### Search System
- Multiple search methods
- Real-time results
- Screenshot capability
- Match highlighting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Vision API for OCR capabilities
- MongoDB for database solutions
- OpenPyXL for Excel integration
- React community for frontend components

## 📧 Contact

Saad Rehman - saadrehman171000@gmail.com  
Project Link: https://github.com/saadrehman171000/OCR-Petition-Validator

## 🔮 Future Enhancements

- Batch processing improvements
- Additional search methods
- Enhanced reporting features
- Mobile responsiveness
- API documentation

## 🚀 Running the Application

1. **Start Backend Server**
```bash
python app.py
```

2. **Start Frontend Development Server**
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`
