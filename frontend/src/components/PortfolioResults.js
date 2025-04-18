import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Assessment,
  Functions
} from '@mui/icons-material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart
} from 'recharts';

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
  
  // State for efficient frontier visualization
  const [efficientFrontierData, setEfficientFrontierData] = useState(null);
  const [efficientFrontierPoints, setEfficientFrontierPoints] = useState([]);
  const [capitalMarketLinePoints, setCapitalMarketLinePoints] = useState([]);
  const [fundPoints, setFundPoints] = useState([]);
  const [gmvpPoint, setGmvpPoint] = useState(null);
  const [marketPortfolioPoint, setMarketPortfolioPoint] = useState(null);
  const [yourPortfolioPoint, setYourPortfolioPoint] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch efficient frontier data
  useEffect(() => {
    const fetchEfficientFrontier = async () => {
      try {
        // In production, uncomment this:
        // const response = await axios.get(`${process.env.REACT_APP_API_URL}/efficient-frontier`);
        // setEfficientFrontierData(response.data);
        
        // For testing, use mock data
        const mockData = {
          "gmvp_with_short": {
            "return": 0.042,
            "volatility": 0.023,
            "weights": {
              "SPDR Straits Times Index ETF": 0.06,
              "Nikko AM Singapore STI ETF": -0.01,
              "NikkoAM-ICBCChina Bond ETF SGD": 0.75
            }
          },
          "gmvp_no_short": {
            "return": 0.043,
            "volatility": 0.023,
            "weights": {
              "SPDR Straits Times Index ETF": 0.04,
              "ABF Singapore Bond Index Fund": 0.20,
              "NikkoAM-ICBCChina Bond ETF SGD": 0.76
            }
          },
          "market_portfolio_with_short": {
            "return": 0.175,
            "volatility": 0.077,
            "sharpe_ratio": 1.88,
            "weights": {
              "SPDR Straits Times Index ETF": 0.38,
              "Nikko AM Singapore STI ETF": 0.23,
              "NikkoAM-ICBCChina Bond ETF SGD": 0.73
            }
          },
          "market_portfolio_no_short": {
            "return": 0.066,
            "volatility": 0.038,
            "sharpe_ratio": 0.93,
            "weights": {
              "SPDR Straits Times Index ETF": 0.22,
              "Nikko AM Singapore STI ETF": 0.09,
              "NikkoAM-ICBCChina Bond ETF SGD": 0.67
            }
          }
        };
        
        setEfficientFrontierData(mockData);
        
        // Generate sample data for visualization
        // Efficient frontier curve
        const efPoints = [];
        for (let i = 0; i <= 10; i++) {
          const vol = 0.02 + (i * 0.015);
          const ret = 0.03 + (vol * 1.5) + (i * 0.005);
          efPoints.push({ volatility: vol, return: ret });
        }
        setEfficientFrontierPoints(efPoints);
        
        // Capital market line
        const cmlPoints = [];
        for (let vol = 0; vol <= 0.15; vol += 0.01) {
          const ret = 0.03 + (vol * 1.5);
          cmlPoints.push({ volatility: vol, return: ret });
        }
        setCapitalMarketLinePoints(cmlPoints);
        
        // Individual fund points
        const funds = [
          { name: "SPDR Straits Times Index ETF", volatility: 0.10, return: 0.12 },
          { name: "Nikko AM Singapore STI ETF", volatility: 0.11, return: 0.12 },
          { name: "Lion-OCBC Securities Singapore Low Carbon ETF", volatility: 0.22, return: 0.02 },
          { name: "Lion-Phillip S-REIT ETF", volatility: 0.14, return: -0.04 },
          { name: "NikkoAM-StraitsTrading Asia ex Japan REIT ETF", volatility: 0.12, return: -0.05 },
          { name: "CapitaLand Integrated Commercial Trust", volatility: 0.19, return: 0.04 },
          { name: "Mapletree Industrial Trust", volatility: 0.17, return: 0.00 },
          { name: "ABF Singapore Bond Index Fund", volatility: 0.05, return: 0.03 },
          { name: "NikkoAM-ICBCChina Bond ETF SGD", volatility: 0.03, return: 0.04 },
          { name: "Lion-OCBC Securities Hang Seng TECH ETF", volatility: 0.37, return: 0.19 }
        ];
        setFundPoints(funds);
        
        // Special portfolio points
        setGmvpPoint({ volatility: mockData.gmvp_no_short.volatility, return: mockData.gmvp_no_short.return });
        setMarketPortfolioPoint({ volatility: mockData.market_portfolio_no_short.volatility, return: mockData.market_portfolio_no_short.return });
        
        // Your portfolio point - based on results prop
        if (results && results.portfolio) {
          setYourPortfolioPoint({ 
            volatility: results.portfolio.volatility, 
            return: results.portfolio.return 
          });
        }
      } catch (error) {
        console.error('Error fetching efficient frontier:', error);
      }
    };
    
    fetchEfficientFrontier();
  }, [results]);

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
          <Tab icon={<Functions />} label="Methodology" />
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
        
        {/* Performance Tab with Efficient Frontier */}
        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Efficient Frontier Analysis
            </Typography>
            <Typography variant="body1" paragraph>
              The chart below shows the efficient frontier, your portfolio, and key reference points.
            </Typography>
            
            <Box sx={{ height: 500, mt: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="volatility" 
                    name="Risk (Volatility)" 
                    domain={[0, 0.4]}
                    label={{ value: 'Risk (Volatility)', position: 'bottom', offset: 20 }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="return" 
                    name="Expected Return"
                    domain={[-0.10, 0.20]}
                    label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: -40 }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [`${(value * 100).toFixed(2)}%`, name]}
                    labelFormatter={() => ''}
                  />
                  <Legend />
                  
                  {/* Capital Market Line */}
                  <Line 
                    name="Capital Market Line" 
                    data={capitalMarketLinePoints} 
                    type="monotone"
                    dataKey="return"
                    stroke="#ff7300" 
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  
                  {/* Efficient Frontier Curve */}
                  <Line 
                    name="Efficient Frontier" 
                    data={efficientFrontierPoints} 
                    type="monotone"
                    dataKey="return"
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  
                  {/* Individual Funds */}
                  <Scatter 
                    name="Individual Funds" 
                    data={fundPoints} 
                    fill="#8884d8"
                  />
                  
                  {/* Global Minimum Variance Portfolio */}
                  {gmvpPoint && (
                    <Scatter 
                      name="Minimum Risk Portfolio" 
                      data={[gmvpPoint]} 
                      fill="#ff0000"
                      shape="star"
                    >
                      {/* Make the point larger */}
                      {<cell width={20} height={20} />}
                    </Scatter>
                  )}
                  
                  {/* Market Portfolio */}
                  {marketPortfolioPoint && (
                    <Scatter 
                      name="Market Portfolio" 
                      data={[marketPortfolioPoint]} 
                      fill="#00ff00"
                      shape="diamond"
                    >
                      {/* Make the point larger */}
                      {<cell width={20} height={20} />}
                    </Scatter>
                  )}
                  
                  {/* Your Portfolio */}
                  {yourPortfolioPoint && (
                    <Scatter 
                      name="Your Portfolio" 
                      data={[yourPortfolioPoint]} 
                      fill="#0000ff"
                      shape="circle"
                    >
                      {/* Make the point larger */}
                      {<cell width={20} height={20} />}
                    </Scatter>
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
              This chart illustrates your portfolio's position relative to the efficient frontier. The efficient frontier represents the set of optimal portfolios that offer the highest expected return for a defined level of risk.
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
        
        {/* Methodology Tab */}
        {tabValue === 4 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Construction Methodology
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Mean-Variance Optimization
            </Typography>
            <Typography variant="body1" paragraph>
              Your portfolio is constructed using Harry Markowitz's Nobel Prize-winning Modern Portfolio Theory.
              This approach optimizes the trade-off between expected return and risk (measured by variance).
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Efficient Frontier
            </Typography>
            <Typography variant="body1" paragraph>
              The efficient frontier represents the set of optimal portfolios that offer the highest 
              expected return for a defined level of risk. Your portfolio lies on this frontier,
              optimized for your personal risk tolerance level of {results.risk_assessment.risk_aversion}.
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Utility Function
            </Typography>
            <Typography variant="body1" paragraph>
              Your portfolio maximizes the utility function U = E(r) - (A/2) * σ², where:
              <br/>• E(r) is the expected return
              <br/>• σ² is the variance (risk)
              <br/>• A is your risk aversion parameter ({results.risk_assessment.risk_aversion})
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Key Portfolio Points
            </Typography>
            <Typography variant="body1">
              • Global Minimum Variance Portfolio: The portfolio with the lowest possible risk
              <br/>• Market Portfolio: The optimal portfolio according to the Capital Asset Pricing Model
              <br/>• Your Portfolio: Optimized based on your specific risk tolerance level of {results.risk_assessment.risk_aversion.toFixed(1)}
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Mathematical Implementation
            </Typography>
            <Typography variant="body1" paragraph>
              Our implementation includes these key steps:
              <br/>• Calculate historical returns and covariance matrix for all funds
              <br/>• Identify the efficient frontier through quadratic optimization
              <br/>• Find the Global Minimum Variance Portfolio (GMVP)
              <br/>• Calculate the Market Portfolio (maximum Sharpe ratio)
              <br/>• Determine the optimal portfolio for your risk aversion parameter
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Portfolio Constraints
            </Typography>
            <Typography variant="body1">
              Your portfolio is optimized with these constraints:
              <br/>• Sum of weights equals 100%
              <br/>• No short-selling (all positions are positive)
              <br/>• Minimum allocation threshold of 1% to avoid tiny positions
            </Typography>
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