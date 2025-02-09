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

2. **Backend Setup**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Environment Configuration**

Create `.env` files in both backend and frontend directories:

Backend `.env`:
```env
MONGODB_URI=your_mongodb_uri
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
FLASK_ENV=development
```

## 📁 Project Structure

```
petition-validator/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── combined_page.js
│   │   │   ├── combined_page.css
│   │   │   ├── SearchPage.js
│   │   │   ├── SearchPage.css
│   │   │   └── LoginPage.js
│   │   └── components/
│   │       └── SearchForm.js
├── backend/
│   ├── app.py               # Main Flask application
│   ├── automation.py        # Automation logic
│   ├── check_petition.py    # Petition verification
│   ├── models.py            # Database models
│   ├── helpers.py           # Utility functions
│   └── detection.py         # Image detection logic
├── data/                    # Data storage
├── Excelsheet/              # Excel templates and outputs
├── processed_images/        # Processed signature images
├── screenshots/             # Search result screenshots
├── uploads/                 # Temporary upload storage
└── requirements.txt         # Python dependencies
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
