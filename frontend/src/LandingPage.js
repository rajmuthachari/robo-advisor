import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Card, 
  CardContent,
  CardMedia,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Timeline, 
  BarChart, 
  Security, 
  PersonOutline,
  Speed,
  TrendingUp,
  AccountBalance,
  ArrowForward
} from '@mui/icons-material';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  padding: theme.spacing(8, 0),
  color: theme.palette.primary.contrastText,
  textAlign: 'center',
  borderRadius: theme.spacing(0, 0, 4, 4),
  marginBottom: theme.spacing(6),
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
  },
}));

const FeatureIcon = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.primary.main,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
}));

const StepCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  borderRadius: theme.spacing(2),
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
}));

const StepNumber = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.palette.secondary.main,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  fontSize: '1.25rem',
  fontWeight: 'bold',
}));

const StartButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  borderRadius: theme.spacing(3),
}));

// LandingPage component
const LandingPage = ({ onStart }) => {
  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Smart Investing Made Simple
          </Typography>
          <Typography variant="h5" component="div" sx={{ mb: 4 }}>
            Personalized investment strategies based on your goals and risk tolerance
          </Typography>
          <StartButton
            variant="contained"
            color="secondary"
            size="large"
            endIcon={<ArrowForward />}
            onClick={onStart}
          >
            Get Started
          </StartButton>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Why Choose Our RoboAdvisor?
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Our advanced algorithm combines modern portfolio theory with personalized risk assessment
            to create investment strategies tailored specifically to your needs.
          </Typography>
        </Box>
        
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FeatureIcon>
                  <PersonOutline fontSize="large" />
                </FeatureIcon>
                <Typography variant="h6" component="h3" gutterBottom>
                  Personalized Strategy
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Tailored investment recommendations based on your unique financial situation, 
                  goals, and risk tolerance.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FeatureIcon>
                  <BarChart fontSize="large" />
                </FeatureIcon>
                <Typography variant="h6" component="h3" gutterBottom>
                  Data-Driven Decisions
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Advanced algorithms analyze thousands of data points to optimize your 
                  portfolio for the best risk-adjusted returns.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FeatureCard>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FeatureIcon>
                  <Security fontSize="large" />
                </FeatureIcon>
                <Typography variant="h6" component="h3" gutterBottom>
                  Low-Cost Solutions
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Access professional investment management at a fraction of the cost of 
                  traditional financial advisors.
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
        </Grid>
        
        {/* How It Works Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Our simple 3-step process makes investing easy, even if you're just getting started.
          </Typography>
        </Box>
        
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={4}>
            <StepCard elevation={1}>
              <StepNumber>1</StepNumber>
              <Typography variant="h6" component="h3" gutterBottom>
                Answer Simple Questions
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tell us about your investment goals, time horizon, and comfort with risk.
              </Typography>
            </StepCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StepCard elevation={1}>
              <StepNumber>2</StepNumber>
              <Typography variant="h6" component="h3" gutterBottom>
                Get Your Portfolio
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Our algorithm builds a diversified portfolio optimized for your risk tolerance.
              </Typography>
            </StepCard>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StepCard elevation={1}>
              <StepNumber>3</StepNumber>
              <Typography variant="h6" component="h3" gutterBottom>
                Review & Implement
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Review your personalized investment plan and put it into action.
              </Typography>
            </StepCard>
          </Grid>
        </Grid>
        
        {/* Call to Action */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(to right, #f5f7fa 0%, #c3cfe2 100%)',
            mb: 8
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Start Your Investment Journey?
          </Typography>
          <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            Take the first step toward financial freedom. Our questionnaire takes less than 5 minutes to complete.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<ArrowForward />}
            onClick={onStart}
          >
            Start Questionnaire
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default LandingPage;
