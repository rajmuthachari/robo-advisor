import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  useMediaQuery
} from '@mui/material';
import Questionnaire from './components/Questionnaire';
import PortfolioResults from './components/PortfolioResults';
import LandingPage from './components/LandingPage';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#388e3c',
      light: '#4caf50',
      dark: '#2e7d32',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
        },
      },
    },
  },
});

// Main App component
function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [results, setResults] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Steps for the advisor process
  const steps = [
    'Welcome',
    'Risk Assessment',
    'Portfolio Recommendation'
  ];

  // Handle questionnaire completion
  const handleQuestionnaireComplete = (data) => {
    setResults(data);
    setActiveStep(2); // Move to results step
  };

  // Reset the process
  const handleReset = () => {
    setActiveStep(0);
    setResults(null);
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <LandingPage onStart={() => setActiveStep(1)} />;
      case 1:
        return <Questionnaire onComplete={handleQuestionnaireComplete} />;
      case 2:
        return <PortfolioResults results={results} onReset={handleReset} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              RoboAdvisor
            </Typography>
            {activeStep > 0 && (
              <Button color="inherit" onClick={handleReset}>
                Start Over
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ py: 3, bgcolor: '#f5f5f5', flexGrow: 1 }}>
          {/* Progress Stepper */}
          {!isMobile && (
            <Container maxWidth="md" sx={{ mb: 4 }}>
              <Paper sx={{ p: 2, borderRadius: 2 }} elevation={1}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Container>
          )}

          {/* Main Content */}
          <Box>
            {getStepContent(activeStep)}
          </Box>
        </Box>

        {/* Footer */}
        <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} RoboAdvisor. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            This is a demonstration project. Not financial advice.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
