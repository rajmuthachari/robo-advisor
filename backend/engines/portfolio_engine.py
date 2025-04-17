"""
Portfolio Engine - Handles portfolio optimization with configurable approaches.
"""
import json
import numpy as np
import pandas as pd
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Any, Optional
from scipy.optimize import minimize


class PortfolioEngine(ABC):
    """Abstract base class for portfolio optimization engines."""
    
    @abstractmethod
    def optimize_portfolio(self, mean_returns: pd.Series, cov_matrix: pd.DataFrame, 
                          risk_aversion: float, **kwargs) -> Dict[str, Any]:
        """
        Optimize portfolio based on mean returns, covariance, and risk aversion.
        
        Args:
            mean_returns: Series of annualized mean returns for each asset
            cov_matrix: Variance-covariance matrix for assets
            risk_aversion: Risk aversion parameter
            
        Returns:
            Dictionary containing the optimized portfolio details
        """
        pass


class MeanVarianceEngine(PortfolioEngine):
    """Mean-Variance Optimization exactly as implemented in the original notebook."""
    
    def __init__(self, config_path: str = "config/portfolio/mean_variance.json"):
        """Initialize with configuration file."""
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def optimize_portfolio(self, mean_returns: pd.Series, cov_matrix: pd.DataFrame, 
                          risk_aversion: float, allow_short: bool = False) -> Dict[str, Any]:
        """
        Mean-variance optimization based on the original notebook implementation.
        
        Args:
            mean_returns: Series of annualized mean returns for each asset
            cov_matrix: Variance-covariance matrix for assets
            risk_aversion: Risk aversion parameter
            allow_short: Whether to allow short positions
            
        Returns:
            Dictionary containing the optimized portfolio details
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
        
        # Filter out insignificant allocations if configured
        min_allocation = self.config.get("min_allocation_threshold", 0.01)
        if min_allocation > 0:
            filtered_weights = optimal_weights[optimal_weights >= min_allocation]
            if not filtered_weights.empty:
                filtered_weights = filtered_weights / filtered_weights.sum()
                
                # Recalculate stats with filtered weights
                filtered_return = np.sum(mean_returns * filtered_weights)
                filtered_volatility = np.sqrt(np.dot(filtered_weights.T, np.dot(
                    cov_matrix.loc[filtered_weights.index, filtered_weights.index], filtered_weights)))
                filtered_sharpe = filtered_return / filtered_volatility if filtered_volatility > 0 else 0
                
                return {
                    "weights": filtered_weights,
                    "full_weights": optimal_weights,
                    "return": filtered_return,
                    "volatility": filtered_volatility,
                    "sharpe_ratio": filtered_sharpe,
                    "utility": -result['fun']
                }
        
        return {
            "weights": optimal_weights,
            "return": portfolio_return,
            "volatility": portfolio_volatility,
            "sharpe_ratio": sharpe_ratio,
            "utility": -result['fun']
        }

class RiskParityEngine(PortfolioEngine):
    """Risk Parity based portfolio engine."""
    
    def __init__(self, config_path: str = "config/portfolio/risk_parity.json"):
        """
        Initialize with configuration file.
        
        Args:
            config_path: Path to portfolio configuration JSON
        """
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def optimize_portfolio(self, mean_returns: pd.Series, cov_matrix: pd.DataFrame, 
                          risk_aversion: float, **kwargs) -> Dict[str, Any]:
        """
        Risk parity portfolio optimization.
        
        Args:
            mean_returns: Series of annualized mean returns for each asset
            cov_matrix: Variance-covariance matrix for assets
            risk_aversion: Risk aversion parameter (used for scaling)
            
        Returns:
            Dictionary containing the optimized portfolio details
        """
        n_assets = len(mean_returns)
        
        # Risk parity objective function
        def risk_contributions(weights):
            portfolio_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            # Calculate risk contribution of each asset
            mrc = np.dot(cov_matrix, weights) / portfolio_vol
            risk_contrib = weights * mrc
            # Target equal risk contribution
            target_risk = portfolio_vol / n_assets
            # Sum of squared differences
            return np.sum((risk_contrib - target_risk)**2)
        
        # Constraints
        constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]  # Weights sum to 1
        
        # Bounds for weights (no short sales)
        bounds = tuple((0, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_weights = np.array([1/n_assets] * n_assets)
        
        # Optimize
        result = minimize(risk_contributions, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)
        
        # Calculate portfolio statistics
        optimal_weights = pd.Series(result['x'], index=mean_returns.index)
        portfolio_return = np.sum(mean_returns * optimal_weights)
        portfolio_volatility = np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))
        sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Scale volatility based on risk aversion
        # Higher risk aversion = lower volatility target
        target_volatility = self.config.get("base_volatility", 0.12) / risk_aversion
        scaling_factor = target_volatility / portfolio_volatility if portfolio_volatility > 0 else 1
        
        # Scale weights (with cash allocation as needed)
        scaled_weights = optimal_weights * scaling_factor
        cash_weight = max(0, 1 - scaled_weights.sum())
        
        result = {
            "weights": scaled_weights,
            "cash_weight": cash_weight,
            "return": portfolio_return * scaling_factor,
            "volatility": portfolio_volatility * scaling_factor,
            "sharpe_ratio": sharpe_ratio,
            "risk_contribution": np.dot(cov_matrix, optimal_weights) * optimal_weights / portfolio_volatility
        }
        
        return result


class PresetPortfolioEngine(PortfolioEngine):
    """Preset portfolio allocations based on risk profile."""
    
    def __init__(self, config_path: str = "config/portfolio/preset_portfolios.json"):
        """
        Initialize with configuration file.
        
        Args:
            config_path: Path to preset portfolios configuration JSON
        """
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def optimize_portfolio(self, mean_returns: pd.Series, cov_matrix: pd.DataFrame, 
                          risk_aversion: float, **kwargs) -> Dict[str, Any]:
        """
        Return a preset portfolio based on risk profile.
        
        Args:
            mean_returns: Series of annualized mean returns for each asset
            cov_matrix: Variance-covariance matrix for assets
            risk_aversion: Risk aversion parameter (used to select portfolio)
            
        Returns:
            Dictionary containing the preset portfolio details
        """
        # Find the preset portfolio that matches the risk aversion level
        portfolio = None
        min_distance = float('inf')
        
        for preset in self.config["portfolios"]:
            distance = abs(preset["risk_aversion"] - risk_aversion)
            if distance < min_distance:
                min_distance = distance
                portfolio = preset
        
        if not portfolio:
            raise ValueError(f"No preset portfolio found for risk aversion {risk_aversion}")
        
        # Convert the preset allocations to a Series matching the input indices
        preset_weights = {}
        for allocation in portfolio["allocations"]:
            asset = allocation["asset"]
            weight = allocation["weight"]
            if asset in mean_returns.index:
                preset_weights[asset] = weight
        
        # Create the weights series
        weights = pd.Series(preset_weights)
        
        # Calculate portfolio statistics
        portfolio_return = np.sum(mean_returns.loc[weights.index] * weights)
        
        # Handle the case where not all assets in the covariance matrix have allocations
        cov_subset = cov_matrix.loc[weights.index, weights.index]
        portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_subset, weights)))
        sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        return {
            "weights": weights,
            "return": portfolio_return,
            "volatility": portfolio_volatility,
            "sharpe_ratio": sharpe_ratio,
            "preset_name": portfolio["name"]
        }


# Factory to create the appropriate portfolio engine
def create_portfolio_engine(engine_type: str = "mean_variance") -> PortfolioEngine:
    """
    Factory function to create portfolio engine of specified type.
    
    Args:
        engine_type: Type of portfolio engine to create
        
    Returns:
        Instance of appropriate PortfolioEngine subclass
    """
    engines = {
        "mean_variance": MeanVarianceEngine,
        "risk_parity": RiskParityEngine,
        "preset": PresetPortfolioEngine
    }
    
    if engine_type not in engines:
        raise ValueError(f"Unknown engine type: {engine_type}. "
                         f"Available types: {list(engines.keys())}")
    
    return engines[engine_type]()
