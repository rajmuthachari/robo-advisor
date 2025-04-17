"""
Notebook Engine - Direct implementation of the algorithms from the original notebook.
"""
import json
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Any, Optional

def calculate_metrics(returns_df: pd.DataFrame, risk_free_rate: float = 0.03) -> pd.DataFrame:
    """
    Calculate key performance metrics for each fund - direct from notebook.
    
    Parameters:
    -----------
    returns_df : pandas.DataFrame
        DataFrame of daily returns
    risk_free_rate : float
        Annualized risk-free rate
        
    Returns:
    --------
    metrics_df : pandas.DataFrame
        DataFrame with calculated metrics for each fund
    """
    # Trading days in a year (approximation)
    trading_days = 252
    
    # Daily risk-free rate
    rf_daily = (1 + risk_free_rate) ** (1 / trading_days) - 1
    
    metrics = {}
    
    for fund in returns_df.columns:
        fund_returns = returns_df[fund]
        
        # Average daily return
        avg_daily_return = fund_returns.mean()
        
        # Annualized return
        annualized_return = (1 + avg_daily_return) ** trading_days - 1
        
        # Volatility (standard deviation of returns)
        daily_volatility = fund_returns.std()
        annualized_volatility = daily_volatility * np.sqrt(trading_days)
        
        # Excess returns over risk-free rate
        excess_returns = fund_returns - rf_daily
        
        # Sharpe ratio
        sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility if annualized_volatility != 0 else 0
        
        # Sortino ratio (using negative returns only for downside deviation)
        downside_returns = fund_returns[fund_returns < 0]
        downside_deviation = downside_returns.std() * np.sqrt(trading_days) if len(downside_returns) > 0 else 0
        sortino_ratio = (annualized_return - risk_free_rate) / downside_deviation if downside_deviation != 0 else 0
        
        # Maximum drawdown
        cumulative_returns = (1 + fund_returns).cumprod()
        rolling_max = cumulative_returns.cummax()
        drawdowns = (cumulative_returns / rolling_max) - 1
        max_drawdown = drawdowns.min()
        
        # Store metrics
        metrics[fund] = {
            'Annualized Return': annualized_return,
            'Annualized Volatility': annualized_volatility,
            'Sharpe Ratio': sharpe_ratio,
            'Sortino Ratio': sortino_ratio,
            'Maximum Drawdown': max_drawdown
        }
    
    # Convert to DataFrame
    metrics_df = pd.DataFrame(metrics).T
    
    return metrics_df

def efficient_frontier(returns_df: pd.DataFrame, cov_matrix: pd.DataFrame, 
                     rf_rate: float = 0.03, points: int = 50, 
                     allow_short: bool = True) -> Dict[str, Any]:
    """
    Generate the efficient frontier - direct from notebook.
    
    Parameters:
    -----------
    returns_df : pandas.DataFrame
        DataFrame of daily returns
    cov_matrix : pandas.DataFrame
        Variance-covariance matrix
    rf_rate : float
        Annualized risk-free rate
    points : int
        Number of points to generate on the frontier
    allow_short : bool
        Whether to allow short sales or not
        
    Returns:
    --------
    Dict containing efficient frontier results
    """
    # Annualized mean returns
    mean_returns = returns_df.mean() * 252
    
    # Number of assets
    n_assets = len(mean_returns)
    
    # Function to minimize portfolio volatility for a given target return
    def portfolio_volatility(weights, mean_returns, cov_matrix):
        return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    # Function to calculate portfolio return
    def portfolio_return(weights, mean_returns):
        return np.sum(mean_returns * weights)
    
    # Function for portfolio volatility optimization
    def min_volatility(target_return, mean_returns, cov_matrix, constraint_set):
        # Objective function (minimize volatility)
        def objective(weights):
            return portfolio_volatility(weights, mean_returns, cov_matrix)
        
        # Constraints
        constraints = [{'type': 'eq', 'fun': lambda x: portfolio_return(x, mean_returns) - target_return}]
        
        # Add constraint that weights sum to 1
        if 'sum' in constraint_set:
            constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Bounds for weights
        bounds = None
        if 'long_only' in constraint_set:
            bounds = tuple((0, 1) for _ in range(n_assets))
        else:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_guess = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        
        return result['fun'], result['x']
    
    # Find the Global Minimum Variance Portfolio (GMVP)
    def find_gmvp(mean_returns, cov_matrix, constraint_set):
        # Objective function (minimize volatility)
        def objective(weights):
            return portfolio_volatility(weights, mean_returns, cov_matrix)
        
        # Constraints
        constraints = []
        
        # Add constraint that weights sum to 1
        if 'sum' in constraint_set:
            constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Bounds for weights
        bounds = None
        if 'long_only' in constraint_set:
            bounds = tuple((0, 1) for _ in range(n_assets))
        else:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_guess = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        
        return {
            'volatility': result['fun'],
            'return': portfolio_return(result['x'], mean_returns),
            'weights': result['x']
        }
    
    # Find the Market Portfolio (tangent portfolio)
    def find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set):
        # Objective function (maximize Sharpe ratio)
        def objective(weights):
            port_return = portfolio_return(weights, mean_returns)
            port_volatility = portfolio_volatility(weights, mean_returns, cov_matrix)
            return -(port_return - rf_rate) / port_volatility  # Negative because we're minimizing
        
        # Constraints
        constraints = []
        
        # Add constraint that weights sum to 1
        if 'sum' in constraint_set:
            constraints.append({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        
        # Bounds for weights
        bounds = None
        if 'long_only' in constraint_set:
            bounds = tuple((0, 1) for _ in range(n_assets))
        else:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_guess = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        
        return {
            'volatility': portfolio_volatility(result['x'], mean_returns, cov_matrix),
            'return': portfolio_return(result['x'], mean_returns),
            'weights': result['x'],
            'sharpe': (portfolio_return(result['x'], mean_returns) - rf_rate) / 
                     portfolio_volatility(result['x'], mean_returns, cov_matrix)
        }
    
    # Define constraint sets for with and without short sales
    constraint_set_with_short = {'sum'}
    constraint_set_no_short = {'sum', 'long_only'}
    
    # Results for with short sales allowed
    gmvp_with_short = find_gmvp(mean_returns, cov_matrix, constraint_set_with_short)
    market_portfolio_with_short = find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set_with_short)
    
    # Results for without short sales
    gmvp_no_short = find_gmvp(mean_returns, cov_matrix, constraint_set_no_short)
    market_portfolio_no_short = find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set_no_short)
    
    # Generate efficient frontier points with short sales
    target_returns_with_short = np.linspace(
        gmvp_with_short['return'], 
        max(mean_returns) * 1.2,  # Go a bit beyond the highest return
        points
    )
    
    ef_volatility_with_short = []
    ef_returns_with_short = []
    
    for target in target_returns_with_short:
        volatility, _ = min_volatility(target, mean_returns, cov_matrix, constraint_set_with_short)
        ef_volatility_with_short.append(volatility)
        ef_returns_with_short.append(target)
    
    # Generate efficient frontier points without short sales
    target_returns_no_short = np.linspace(
        gmvp_no_short['return'],
        max(mean_returns),
        points
    )
    
    ef_volatility_no_short = []
    ef_returns_no_short = []
    
    for target in target_returns_no_short:
        try:
            volatility, _ = min_volatility(target, mean_returns, cov_matrix, constraint_set_no_short)
            ef_volatility_no_short.append(volatility)
            ef_returns_no_short.append(target)
        except:
            # Skip if optimization fails for a target return
            pass
    
    return {
        'ef_with_short': (ef_returns_with_short, ef_volatility_with_short),
        'ef_no_short': (ef_returns_no_short, ef_volatility_no_short),
        'gmvp_with_short': gmvp_with_short,
        'gmvp_no_short': gmvp_no_short,
        'market_portfolio_with_short': market_portfolio_with_short,
        'market_portfolio_no_short': market_portfolio_no_short
    }

def calculate_optimal_portfolio(mean_returns: pd.Series, cov_matrix: pd.DataFrame, 
                             risk_aversion: float, allow_short: bool = False) -> Tuple[pd.Series, Dict[str, Any]]:
    """
    Calculate the optimal portfolio based on the risk aversion parameter.
    
    Parameters:
    -----------
    mean_returns : pandas.Series
        Series of annualized mean returns for each asset
    cov_matrix : pandas.DataFrame
        Variance-covariance matrix
    risk_aversion : float
        Risk aversion parameter value (A)
    allow_short : bool
        Whether to allow short sales or not
    
    Returns:
    --------
    optimal_weights : pandas.Series
        Optimal portfolio weights
    portfolio_stats : dict
        Dictionary containing portfolio statistics
    """
    n_assets = len(mean_returns)
    
    # Define the utility function to maximize: U = r - (A/2) * σ²
    def utility(weights):
        portfolio_return = np.sum(mean_returns * weights)
        portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
        utility_value = portfolio_return - (risk_aversion / 2) * portfolio_variance
        return -utility_value  # Negative because we're minimizing
    
    # Constraints
    constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]  # Weights sum to 1
    
    # Bounds for weights
    if allow_short:
        bounds = tuple((-1, 1) for _ in range(n_assets))
    else:
        bounds = tuple((0, 1) for _ in range(n_assets))
    
    # Initial guess
    initial_weights = np.array([1/n_assets] * n_assets)
    
    # Optimize
    result = minimize(utility, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)
    
    # Calculate portfolio statistics
    optimal_weights = pd.Series(result['x'], index=mean_returns.index)
    portfolio_return = np.sum(mean_returns * optimal_weights)
    portfolio_volatility = np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))
    sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
    
    portfolio_stats = {
        'return': portfolio_return,
        'volatility': portfolio_volatility,
        'sharpe_ratio': sharpe_ratio,
        'utility': -result['fun']  # Negate back since we minimized the negative utility
    }
    
    return optimal_weights, portfolio_stats
