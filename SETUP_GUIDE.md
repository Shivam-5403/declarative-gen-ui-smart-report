# Setup & Troubleshooting Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- Google Gemini API key (free tier available)
- Git (optional)

## Setup Instructions

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Gemini API key
echo "GOOGLE_API_KEY=your_actual_gemini_api_key_here" > .env

# Verify installation
python -c "import fastapi, langgraph, pydantic; print('✓ Dependencies OK')"

# Start backend server
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify Tailwind CSS is configured
npm run build

# Start development server
npm run dev
```

Expected output:
```
  VITE v7.3.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h + enter to show help
```

### Step 3: Verify Both Are Running

**Backend Check:**
```bash
curl http://localhost:8000/
# Should return: {"status":"active","service":"Smart Health Engine"}
```

**Frontend Check:**
```bash
# Open in browser: http://localhost:5173
# Should see the Smart Report interface
```

## Environment Variables

### Backend (.env file)
```env
# Required
GOOGLE_API_KEY=your_gemini_api_key

# Optional
BACKEND_PORT=8000
LOG_LEVEL=INFO
CACHE_ENABLED=true
```

### Frontend (.env.local file)
```env
# Optional - if backend is on different machine
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Getting a Gemini API Key

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create a new Google Cloud project or select existing
4. Enable the API
5. Copy the API key
6. Add to your `.env` file

Free tier includes:
- 60 requests per minute
- Unlimited requests per day (up to 1500 daily for free)

## Troubleshooting

### Backend Issues

#### "ModuleNotFoundError: No module named 'xxx'"
**Solution:**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Or specify specific missing package
pip install fastapi
```

#### "GOOGLE_API_KEY not found"
**Solution:**
```bash
# Make sure .env file exists in backend/ directory
ls -la backend/.env

# Test reading the key
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GOOGLE_API_KEY'))"
```

#### "Connection refused" on http://localhost:8000
**Solution:**
```bash
# Check if port 8000 is already in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process using port 8000
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Start backend again
python main.py
```

#### "Gemini API Error"
**Solution:**
1. Verify API key is correct: `echo $GOOGLE_API_KEY`
2. Check API is enabled in Google Cloud Console
3. Check rate limits: https://ai.google.dev/pricing
4. Try with a simpler prompt first

**Debug:**
```python
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
response = llm.invoke("Hello")
print(response.content)  # Should print a response
```

#### "Pydantic validation error"
**Solution:**
```bash
# Update Pydantic version
pip install --upgrade pydantic

# Or match the one in requirements.txt
pip install pydantic==2.0.0
```

### Frontend Issues

#### "npm ERR! code ERESOLVE"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps flag
npm install --legacy-peer-deps

# Or use npm 7+ with force flag
npm install --force
```

#### "Cannot find module 'axios' or 'recharts'"
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or specific packages
npm install axios recharts lucide-react
```

#### "Backend not reachable"
**Solution:**
```bash
# Check if backend is actually running
curl -v http://localhost:8000/

# If not, start backend:
cd backend
python main.py

# Check CORS headers
curl -v -X OPTIONS http://localhost:8000/ \
  -H "Origin: http://localhost:5173"
```

#### "Components not loading"
**Solution:**
```javascript
// In browser console, check:
console.log(componentMap);  // Should have 16+ components
console.log(schemas);       // Should have all component schemas

// Check network tab for /api/schema-export request
// Should return 200 with JSON data
```

### Network/CORS Issues

#### "CORS error: Origin not allowed"
**Solution:**
The backend is configured to allow all origins by default:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    ...
)
```

For production, restrict to known origins:
```python
allow_origins=["https://yourdomain.com", "https://app.yourdomain.com"]
```

#### "Blocked by CORS policy"
**Solution:**
1. Make sure backend is running on port 8000
2. Check frontend's BACKEND_URL matches: `http://localhost:8000`
3. Restart both frontend and backend
4. Clear browser cache (Ctrl+Shift+Delete)

### Validation Issues

#### "Manifest validation failed"
**Solution:**
```javascript
// In browser console:
const validation = validateManifest(manifest, schemas);
console.log(validation.errors);    // See what failed
console.log(validation.warnings);  // See warnings
```

Check:
1. All required component props are present
2. Props match the JSON Schema
3. Component types are registered

#### "Unknown component: ComponentName"
**Solution:**
1. Verify component exists in `frontend/src/components/`
2. Check it's imported in `componentRegistry.js`
3. Restart frontend (`npm run dev`)
4. Verify `/api/schema-export` includes it

## Performance Optimization

### Backend Optimization
```python
# Cache LLM responses
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_analysis(report_hash):
    return analyze_report(report)

# Use async for I/O
async def analyze_report(report):
    result = await llm.ainvoke(...)
    return result
```

### Frontend Optimization
```javascript
// Lazy load components
const InsightHeader = React.lazy(() => import('./InsightHeader'));

// Memoize expensive components
const MemoizedAccordion = React.memo(MetricAccordion);

// Pagination for large lists
const [page, setPage] = useState(1);
const pageSize = 10;
const items = manifest.items.slice(page * pageSize, (page + 1) * pageSize);
```

## Monitoring & Logging

### Backend Logging
```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# In your code
logger.debug("Manifest generated with %d components", len(manifest.items))
logger.error("Failed to validate: %s", str(e))
```

### Frontend Logging
```javascript
// Enable debug mode
window.DEBUG_MANIFEST = true;

// Or in localStorage
localStorage.setItem('DEBUG_MANIFEST', 'true');

// Then watch console for detailed logs
// Log manifest to CSV
const csv = JSON.stringify(manifest.items);
console.table(manifest.items);
```

## Health Checks

### Backend Health Check
```bash
#!/bin/bash
# health_check.sh

BACKEND_URL="http://localhost:8000"

# Check backend is running
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend returned HTTP $http_code"
    exit 1
fi

# Check schema export is working
response=$(curl -s "$BACKEND_URL/api/schema-export")
component_count=$(echo "$response" | grep -o '"componentName"' | wc -l)
echo "✓ Found $component_count components"
```

### Frontend Health Check
```javascript
// In browser console
async function healthCheck() {
    try {
        const schemas = await fetch('/api/schema-export').then(r => r.json());
        console.log('✓ Components loaded:', Object.keys(schemas).length);
        
        const response = await fetch('/analyze', {method: 'POST', body: JSON.stringify({...})});
        console.log('✓ Analysis endpoint working');
    } catch(err) {
        console.error('✗ Health check failed:', err);
    }
}

healthCheck();
```

## Common Workflows

### Testing an Analysis
```bash
# 1. Start both servers
cd backend && python main.py &
cd frontend && npm run dev &

# 2. Send test data to backend
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d @test_data.json

# 3. Check the response manifest
# 4. Verify it renders in frontend at http://localhost:5173

# 5. Check console for warnings
# 6. Validate props in DevTools
```

### Adding a New Component
```bash
# 1. Create component file
touch frontend/src/components/MyComponent.jsx

# 2. Define Pydantic model
# Edit backend/schema.py - add MyComponentProps

# 3. Add to component registry
# Edit backend/components.py - add ComponentDefinition

# 4. Add to component imports
# Edit frontend/src/config/componentRegistry.js

# 5. Add rule (optional)
# Edit backend/ui_rules.py - add Rule

# 6. Restart both servers
# 7. Test with /api/schema-export endpoint
```

## Getting Help

### Check Logs
```bash
# Backend logs
tail -f backend.log

# Frontend browser console
F12 → Console tab

# Network traffic
F12 → Network tab → monitor /analyze and /api/schema-export
```

### Enable Debug Mode
```python
# Backend
os.environ['DEBUG'] = 'true'
logging.basicConfig(level=logging.DEBUG)

# Frontend
window.DEBUG_MANIFEST = true;
```

### Test Individual Components
```javascript
// Test a component in isolation
import MetricAccordion from './components/MetricAccordion';

const testProps = {
  parameter: "HbA1c",
  value: "8.2%",
  status: "HIGH",
  causes: ["Diabetes"],
  effects: ["Complications"],
  clinical_note: "Test"
};

ReactDOM.render(
  <MetricAccordion {...testProps} />,
  document.getElementById('root')
);
```

---

**Last Updated**: February 12, 2025
**Status**: Ready for deployment
