import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Divider, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Info, 
  GetApp, 
  Print, 
  Share, 
  ArrowUpward, 
  ArrowDownward,
  AccountBalance,
  ShowChart,
  Psychology,
  Assessment
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

// Styled components
const ResultsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(8),
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  background: `linear-gradient(145deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const FundCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.spacing(3),
}));

// Custom components
const MetricValue = ({ value, prefix = '', suffix = '', isPercent = false, isPositive = true }) => {
  let formattedValue = value;
  
  if (isPercent) {
    formattedValue = (value * 100).toFixed(2) + '%';
  } else if (typeof value === 'number') {
    formattedValue = value.toFixed(2);
  }
  
  return (
    <Typography variant="h4" component="div" sx={{ 
      fontWeight: 'bold',
      color: isPercent ? (isPositive ? 'success.main' : 'error.main') : 'text.primary'
    }}>
      {prefix}{formattedValue}{suffix}
      {isPercent && (
        <Box component="span" sx={{ ml: 1 }}>
          {isPositive ? <ArrowUpward color="success" /> : <ArrowDownward color="error" />}
        </Box>
      )}
    </Typography>
  );
};

// COLORS for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57', '#FECDE6', '#F95D6A'];

// PortfolioResults component
const PortfolioResults = ({ results, onReset }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format portfolio data for chart
  const formatPortfolioData = () => {
    if (!results || !results.portfolio || !results.portfolio.weights) return [];
    
    return Object.entries(results.portfolio.weights)
      .map(([name, weight], index) => ({
        name,
        value: parseFloat((weight * 100).toFixed(2)),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };

  const portfolioData = formatPortfolioData();

  // Generate PDF report
  const generatePDFReport = () => {
    // Implementation would be added for PDF generation
    alert('PDF report generation functionality would be implemented here');
  };

  // Handle sharing
  const handleShare = () => {
    // Implementation would be added for sharing functionality
    alert('Sharing functionality would be implemented here');
  };

  if (!results || !results.risk_assessment || !results.portfolio) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>No portfolio results available.</Typography>
      </Box>
    );
  }

  return (
    <ResultsContainer maxWidth="lg">
      {/* Header Section */}
      <HeaderPaper elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Your Personalized Investment Plan
          </Typography>
          <Box>
            <ActionButton 
              variant="outlined" 
              color="inherit" 
              startIcon={<GetApp />}
              onClick={generatePDFReport}
            >
              Download PDF
            </ActionButton>
            <ActionButton
              variant="outlined"
              color="inherit"
              startIcon={<Share />}
              onClick={handleShare}
            >
              Share
            </ActionButton>
          </Box>
        </Box>
        <Typography variant="h6">
          Based on your responses, we've identified your risk profile as:
        </Typography>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', my: 2 }}>
          {results.risk_assessment.profile}
        </Typography>
        <Typography variant="body1" paragraph>
          This profile reflects your investment goals, time horizon, and comfort with market fluctuations.
        </Typography>
      </HeaderPaper>

      {/* Metrics Overview */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Portfolio Performance Metrics
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Expected Annual Return
                </Typography>
                <MetricValue 
                  value={results.portfolio.return} 
                  isPercent={true}
                  isPositive={results.portfolio.return > 0}
                />
              </CardContent>
            </MetricCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Expected Volatility
                </Typography>
                <MetricValue 
                  value={results.portfolio.volatility} 
                  isPercent={true}
                  isPositive={false}
                />
              </CardContent>
            </MetricCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Sharpe Ratio
                </Typography>
                <MetricValue 
                  value={results.portfolio.sharpe_ratio} 
                  isPositive={results.portfolio.sharpe_ratio > 1}
                />
                <Typography variant="caption" color="textSecondary">
                  Higher is better (>1 is good)
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Risk Level
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {results.risk_assessment.risk_aversion < 3 ? 'High' : 
                   results.risk_assessment.risk_aversion < 5 ? 'Moderate' : 'Low'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Risk Aversion: {results.risk_assessment.risk_aversion.toFixed(1)}
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      </Paper>

      {/* Portfolio Visualization */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recommended Portfolio Allocation
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Box sx={{ height: 400, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip formatter={(value) => [`${value}%`, 'Allocation']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fund</TableCell>
                    <TableCell align="right">Allocation</TableCell>
                    <TableCell align="right">Expected Return</TableCell>
                    <TableCell align="right">Risk (Volatility)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolioData.map((fund, index) => {
                    const fundInfo = results.funds[fund.name] || {};
                    const metrics = fundInfo.metrics || {};
                    
                    return (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                bgcolor: fund.color,
                                mr: 1 
                              }} 
                            />
                            {fund.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">{fund.value}%</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {metrics['Annualized Return'] ? 
                            `${(metrics['Annualized Return'] * 100).toFixed(2)}%` : 
                            'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {metrics['Annualized Volatility'] ? 
                            `${(metrics['Annualized Volatility'] * 100).toFixed(2)}%` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Information Tabs */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab icon={<AccountBalance />} label="Fund Details" />
          <Tab icon={<ShowChart />} label="Performance" />
          <Tab icon={<Psychology />} label="Risk Profile" />
          <Tab icon={<Assessment />} label="Recommendations" />
        </Tabs>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Fund Details Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {portfolioData.map((fund, index) => {
              const fundInfo = results.funds[fund.name] || {};
              const metadata = fundInfo.metadata || {};
              
              return (
                <Grid item xs={12} md={6} key={index}>
                  <FundCard>
                    <CardHeader
                      title={fund.name}
                      subheader={metadata.fund_manager || 'Fund Manager Information Unavailable'}
                      action={
                        <Tooltip title="View Full Details">
                          <IconButton>
                            <Info />
                          </IconButton>
                        </Tooltip>
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Expense Ratio</Typography>
                          <Typography variant="body1">
                            {metadata.expense_ratio ? 
                              `${(metadata.expense_ratio * 100).toFixed(2)}%` : 
                              'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Fund Size</Typography>
                          <Typography variant="body1">
                            {metadata.fund_size ? 
                              `$${(metadata.fund_size / 1000000).toFixed(1)}M` : 
                              'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Inception Date</Typography>
                          <Typography variant="body1">
                            {metadata.inception_date ? 
                              new Date(metadata.inception_date * 1000).toLocaleDateString() : 
                              'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Category</Typography>
                          <Typography variant="body1">
                            {metadata.category || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Allocation in Your Portfolio
                          </Typography>
                          <Chip 
                            label={`${fund.value}%`}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </FundCard>
                </Grid>
              );
            })}
          </Grid>
        )}
        
        {/* Performance Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Historical and Projected Performance
            </Typography>
            <Typography variant="body1" paragraph>
              This section would include historical performance charts and projected future performance
              based on different market scenarios. Implementation would depend on available data.
            </Typography>
          </Box>
        )}
        
        {/* Risk Profile Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Risk Profile: {results.risk_assessment.profile}
            </Typography>
            <Typography variant="body1" paragraph>
              Based on your responses to our questionnaire, we've determined that you have a 
              {results.risk_assessment.profile.toLowerCase()} approach to investing. This means you 
              {results.risk_assessment.risk_aversion < 3 ? 
                ' are comfortable with higher levels of risk in pursuit of greater returns.' : 
                results.risk_assessment.risk_aversion < 5 ? 
                ' prefer a balanced approach to risk and return.' : 
                ' prioritize capital preservation over seeking high returns.'}
            </Typography>
            <Typography variant="body1" paragraph>
              Your risk aversion parameter is {results.risk_assessment.risk_aversion.toFixed(1)}, which helps us 
              optimize your portfolio allocation to match your comfort level with market fluctuations.
            </Typography>
          </Box>
        )}
        
        {/* Recommendations Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Investment Recommendations and Next Steps
            </Typography>
            <Typography variant="body1" paragraph>
              Based on your risk profile and financial goals, here are our recommendations:
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  • Implement the recommended portfolio allocation shown above
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  • Consider setting up automatic investments to benefit from dollar-cost averaging
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  • Review and rebalance your portfolio quarterly to maintain your target allocation
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  • Consider consulting with a financial advisor for personalized advice
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={onReset}
          sx={{ mr: 2 }}
        >
          Start Over
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={generatePDFReport}
        >
          Download Investment Plan
        </Button>
      </Box>
    </ResultsContainer>
  );
};

export default PortfolioResults;
