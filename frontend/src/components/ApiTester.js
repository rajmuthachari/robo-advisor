import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Container,
  CircularProgress,
  TextField
} from '@mui/material';

const API_URL = 'http://127.0.0.1:5000/api';

const ApiTester = () => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(`${API_URL}/questionnaire`);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      console.log('Testing connection to:', url);
      const result = await axios.get(url);
      console.log('Response:', result);
      setResponse(result.data);
    } catch (err) {
      console.error('Error details:', err);
      let errorMessage = 'Connection failed.';
      if (err.response) {
        errorMessage += ` Server responded with status ${err.response.status}.`;
        console.error('Response data:', err.response.data);
      } else if (err.request) {
        errorMessage += ' No response received from server.';
        console.error('Request made but no response:', err.request);
      } else {
        errorMessage += ` Error message: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
        <Typography variant="h4" gutterBottom>API Connection Tester</Typography>
        
        <Box sx={{ my: 3 }}>
          <TextField 
            fullWidth
            label="API URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            margin="normal"
          />
          
          <Button 
            variant="contained" 
            onClick={testConnection} 
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Test Connection'}
          </Button>
        </Box>
        
        {error && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
            <Typography color="error" variant="h6">Error</Typography>
            <Typography>{error}</Typography>
          </Box>
        )}
        
        {response && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Response</Typography>
            <Box 
              component="pre" 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1, 
                overflow: 'auto',
                maxHeight: '400px' 
              }}
            >
              {JSON.stringify(response, null, 2)}
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ApiTester;