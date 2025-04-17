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
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  // Fetch questionnaire data
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/questionnaire`);
        setQuestionnaire(response.data);
        
        // Initialize responses object
        const initialResponses = {};
        response.data.questions.forEach(q => {
          initialResponses[q.id] = null;
        });
        setResponses(initialResponses);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load questionnaire. Please try again later.');
        setLoading(false);
        console.error('Error fetching questionnaire:', err);
      }
    };

    fetchQuestionnaire();
  }, []);

  // Group questions by section
  const getQuestionsBySection = () => {
    if (!questionnaire) return [];
    
    const sections = questionnaire.sections.map(section => ({
      ...section,
      questions: questionnaire.questions.filter(q => q.section === section.id)
    }));
    
    return sections;
  };

  const sections = getQuestionsBySection();
  
  // Get current section questions
  const getCurrentSectionQuestions = () => {
    if (sections.length === 0) return [];
    return sections[currentSection].questions;
  };

  // Handle option selection
  const handleOptionSelect = (questionId, value) => {
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
      
      // Convert responses object to array of scores
      const responseScores = Object.keys(responses).map(questionId => {
        return responses[questionId];
      });
      
      // Submit to API
      const response = await axios.post(`${API_URL}/complete`, {
        responses: responseScores
      });
      
      // Call onComplete with results
      onComplete(response.data);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to submit your responses. Please try again later.');
      setLoading(false);
      console.error('Error submitting questionnaire:', err);
    }
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!questionnaire) return false;
    
    const sectionQuestions = getCurrentSectionQuestions();
    if (sectionQuestions.length === 0) return false;
    
    const currentQuestionId = sectionQuestions[currentQuestion].id;
    return responses[currentQuestionId] !== null;
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
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Questionnaire;
              
              <NavigationButton
                variant="contained"
                endIcon={currentSection === sections.length - 1 && currentQuestion === getCurrentSectionQuestions().length - 1 ? <CheckCircle /> : <ArrowForward />}
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered() || loading}
              >
                {currentSection === sections.length - 1 && currentQuestion === getCurrentSectionQuestions().length - 1 ? 'Submit' : 'Next'}
                {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </NavigationButton>
