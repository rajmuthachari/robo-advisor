import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Radio, 
  RadioGroup,
  FormControlLabel,
  FormControl, 
  CircularProgress, 
  Paper,
  Container,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowForward, ArrowBack, CheckCircle } from '@mui/icons-material';
import axios from 'axios';

// Configuration
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';
//const API_URL = process.env.REACT_APP_API_URL || '/api';
// Setting axios defaults to help with potential issues
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Styled components
const QuestionCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const OptionButton = styled(FormControlLabel)(({ theme, selected }) => ({
  width: '100%',
  margin: theme.spacing(1, 0),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
  backgroundColor: selected ? 'rgba(63, 81, 181, 0.08)' : 'white',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected ? 'rgba(63, 81, 181, 0.12)' : 'rgba(0, 0, 0, 0.04)',
    transform: 'scale(1.01)',
  },
}));

const NavigationButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(3),
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  fontWeight: 600,
}));

// Main Questionnaire Component
const Questionnaire = ({ onComplete }) => {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);

  // Fetch questionnaire data
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        // Add debugging logs
        console.log('Fetching questionnaire from:', `${API_URL}/questionnaire`);
        
        const response = await axios.get(`${API_URL}/questionnaire`);
        console.log('Received questionnaire response:', response);
        
        // Set the questionnaire data from the API response
        setQuestionnaire(response.data);
        console.log('Questionnaire data set:', response.data);
        
        // Group questions by section
        const sectionList = response.data.sections.map(section => ({
          ...section,
          questions: response.data.questions.filter(q => q.section === section.id)
        }));
        console.log('Grouped sections:', sectionList);
        
        setSections(sectionList);
        
        // Initialize responses object
        const initialResponses = {};
        response.data.questions.forEach(q => {
          initialResponses[q.id] = null;
        });
        setResponses(initialResponses);
        
        setLoading(false);
      } catch (err) {
        console.error('Error details:', err);
        // More detailed error message
        let errorMessage = 'Failed to load questionnaire. Please try again later.';
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage += ` Server responded with status ${err.response.status}.`;
          console.error('Response data:', err.response.data);
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage += ' No response received from server.';
          console.error('Request made but no response:', err.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage += ` Error message: ${err.message}`;
        }
        setError(errorMessage);
        setLoading(false);
        
        // Optionally, fall back to mock data during debugging
        /*
        console.log('Using mock data as fallback');
        const mockQuestionnaire = {
          id: "default_questionnaire",
          title: "Investment Risk Assessment",
          description: "This questionnaire will help us understand your investment goals and risk tolerance to create a personalized portfolio recommendation.",
          sections: [
            {
              id: "demographics",
              title: "Demographics & Time Horizon",
              description: "Understanding your personal situation helps us determine suitable investment strategies.",
              weight: 1.0
            },
            {
              id: "financial",
              title: "Financial Situation",
              description: "Your current financial position affects how much risk is appropriate for you.",
              weight: 1.0
            },
            {
              id: "behavior",
              title: "Investment Behavior & Reactions",
              description: "How you react to market fluctuations is an important factor in determining your risk profile.",
              weight: 1.5
            },
            {
              id: "philosophy",
              title: "Investment Philosophy & Objectives",
              description: "Your personal investment approach and goals guide our recommendations.",
              weight: 1.3
            },
            {
              id: "scenarios",
              title: "Hypothetical Scenarios",
              description: "These scenarios help us gauge your risk tolerance in concrete situations.",
              weight: 1.2
            }
          ],
          questions: [
            // Add questions here if needed as a fallback
          ]
        };
        
        setQuestionnaire(mockQuestionnaire);
        
        // Group questions by section
        const sectionList = mockQuestionnaire.sections.map(section => ({
          ...section,
          questions: mockQuestionnaire.questions.filter(q => q.section === section.id)
        }));
        
        setSections(sectionList);
        
        // Initialize responses object
        const initialResponses = {};
        mockQuestionnaire.questions.forEach(q => {
          initialResponses[q.id] = null;
        });
        setResponses(initialResponses);
        
        setLoading(false);
        */
      }
    };

    fetchQuestionnaire();
  }, []);

  // Get current section questions
  const getCurrentSectionQuestions = () => {
    if (sections.length === 0) return [];
    return sections[currentSection].questions;
  };

  // Handle option selection
  const handleOptionSelect = (questionId, value) => {
    console.log('Selected option:', questionId, value);
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  // Navigation handlers
  const handleNext = () => {
    const sectionQuestions = getCurrentSectionQuestions();
    
    if (currentQuestion < sectionQuestions.length - 1) {
      // Move to next question in section
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < sections.length - 1) {
      // Move to next section
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else {
      // Questionnaire complete
      submitQuestionnaire();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      // Move to previous question in section
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      // Move to last question of previous section
      setCurrentSection(currentSection - 1);
      const prevSectionQuestions = sections[currentSection - 1].questions;
      setCurrentQuestion(prevSectionQuestions.length - 1);
    }
  };

  // Submit questionnaire
  const submitQuestionnaire = async () => {
    try {
      setLoading(true);
      console.log('Submitting responses:', responses);
      
      // Call the actual API endpoint
      const response = await axios.post(`${API_URL}/complete`, {
        responses: responses
      });
      console.log('Received submission response:', response);
      
      // Call onComplete with the actual results
      onComplete(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error submitting questionnaire:', err);
      let errorMessage = 'Failed to submit your responses. Please try again later.';
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
      setLoading(false);
    }
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!questionnaire || sections.length === 0) return false;
    
    const sectionQuestions = getCurrentSectionQuestions();
    if (sectionQuestions.length === 0) return false;
    
    const currentQuestionId = sectionQuestions[currentQuestion]?.id;
    return responses[currentQuestionId] !== null && responses[currentQuestionId] !== undefined;
  };

  // Loading state
  if (loading && !questionnaire) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error
          </Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 3 }}
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Paper>
      </Box>
    );
  }

  // No questionnaire data
  if (!questionnaire) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>No questionnaire available.</Typography>
      </Box>
    );
  }

  // Render the questionnaire
  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', my: 4 }}>
        {/* Questionnaire Header */}
        <Typography variant="h4" align="center" gutterBottom>
          {questionnaire.title}
        </Typography>
        
        {questionnaire.description && (
          <Typography variant="body1" align="center" color="textSecondary" paragraph>
            {questionnaire.description}
          </Typography>
        )}

        {/* Progress Stepper */}
        <Stepper activeStep={currentSection} alternativeLabel sx={{ mt: 4, mb: 2 }}>
          {sections.map((section) => (
            <Step key={section.id}>
              <StepLabel>{section.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Current Section */}
        {sections.length > 0 && (
          <>
            <SectionHeading variant="h5">
              {sections[currentSection].title}
            </SectionHeading>
            
            {sections[currentSection].description && (
              <Typography variant="body2" color="textSecondary" paragraph>
                {sections[currentSection].description}
              </Typography>
            )}

            {/* Current Question */}
            {getCurrentSectionQuestions().length > 0 && (
              <QuestionCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Question {currentQuestion + 1} of {getCurrentSectionQuestions().length}
                  </Typography>
                  
                  <Typography variant="h5" paragraph>
                    {getCurrentSectionQuestions()[currentQuestion].text}
                  </Typography>
                  
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={responses[getCurrentSectionQuestions()[currentQuestion].id] || ''}
                      onChange={(e) => handleOptionSelect(
                        getCurrentSectionQuestions()[currentQuestion].id, 
                        parseInt(e.target.value)
                      )}
                    >
                      <Grid container spacing={2}>
                        {getCurrentSectionQuestions()[currentQuestion].options.map((option, index) => (
                          <Grid item xs={12} key={index}>
                            <OptionButton
                              value={option.score}
                              control={<Radio color="primary" />}
                              label={option.text}
                              selected={responses[getCurrentSectionQuestions()[currentQuestion].id] === option.score}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </QuestionCard>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <NavigationButton
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                disabled={currentSection === 0 && currentQuestion === 0}
              >
                Back
              </NavigationButton>
              
              <NavigationButton
                variant="contained"
                endIcon={currentSection === sections.length - 1 && currentQuestion === getCurrentSectionQuestions().length - 1 ? <CheckCircle /> : <ArrowForward />}
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered() || loading}
              >
                {currentSection === sections.length - 1 && currentQuestion === getCurrentSectionQuestions().length - 1 ? 'Submit' : 'Next'}
                {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </NavigationButton>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Questionnaire;