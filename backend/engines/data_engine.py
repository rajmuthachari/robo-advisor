"""
Data Engine - Handles retrieving and processing fund data.
"""
import json
import os
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime, timedelta
import yfinance as yf


class DataEngine:
    """Handles data retrieval and processing for funds."""
    
    def __init__(self, config_path: str = "config/funds/fund_config.json"):
        """
        Initialize with configuration file.
        
        Args:
            config_path: Path to fund configuration JSON
        """
        self.config_path = config_path
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.cache_dir = self.config.get("cache_dir", "data/cache")
        self.cache_expiry_days = self.config.get("cache_expiry_days", 7)
        
        # Create cache directory if it doesn't exist
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def get_fund_list(self) -> Dict[str, str]:
        """
        Get the list of funds from configuration.
        
        Returns:
            Dictionary mapping fund names to tickers
        """
        return {fund["name"]: fund["ticker"] for fund in self.config["funds"]}
    
    def get_fund_data(self, start_date: Optional[str] = None, 
                     end_date: Optional[str] = None, 
                     use_cache: bool = True) -> Tuple[pd.DataFrame, Dict[str, Dict[str, Any]]]:
        """
        Get historical price data and metadata for configured funds.
        
        Args:
            start_date: Start date in 'YYYY-MM-DD' format, defaults to 3 years ago
            end_date: End date in 'YYYY-MM-DD' format, defaults to today
            use_cache: Whether to use cached data if available
            
        Returns:
            Tuple of (prices_df, metadata_dict)
        """
        # Set default dates if not provided
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=3*365)).strftime('%Y-%m-%d')
        
        # Check if cached data exists and is fresh
        cache_file = os.path.join(self.cache_dir, f"fund_data_{start_date}_to_{end_date}.pkl")
        metadata_file = os.path.join(self.cache_dir, f"fund_metadata_{start_date}_to_{end_date}.json")
        
        if use_cache and self._is_cache_valid(cache_file):
            try:
                prices_df = pd.read_pickle(cache_file)
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                return prices_df, metadata
            except (FileNotFoundError, Exception) as e:
                print(f"Cache read error: {e}. Fetching fresh data.")
        
        # Fetch fresh data
        fund_data, metadata = self._fetch_fund_data(start_date, end_date)
        
        # Convert to DataFrame and fill missing values
        prices_df = pd.DataFrame(fund_data)
        prices_df = prices_df.fillna(method='ffill')
        
        # Cache the data
        if use_cache:
            prices_df.to_pickle(cache_file)
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f)
        
        return prices_df, metadata
    
    def calculate_returns(self, prices_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate daily returns from price data.
        
        Args:
            prices_df: DataFrame of daily prices
            
        Returns:
            DataFrame of daily returns
        """
        return prices_df.pct_change().dropna()
    
    def calculate_metrics(self, returns_df: pd.DataFrame, 
                         risk_free_rate: float = 0.03) -> pd.DataFrame:
        """
        Calculate key performance metrics for each fund - uses the exact notebook implementation.
        
        Args:
            returns_df: DataFrame of daily returns
            risk_free_rate: Annualized risk-free rate
            
        Returns:
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
    
    def _fetch_fund_data(self, start_date: str, end_date: str) -> Tuple[Dict[str, pd.Series], Dict[str, Dict[str, Any]]]:
        """
        Fetch historical price data for funds.
        
        Args:
            start_date: Start date in 'YYYY-MM-DD' format
            end_date: End date in 'YYYY-MM-DD' format
            
        Returns:
            Tuple of (fund_data_dict, metadata_dict)
        """
        fund_list = self.get_fund_list()
        fund_data = {}
        metadata = {}
        
        for fund_name, ticker in fund_list.items():
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(start=start_date, end=end_date)
                
                if not hist.empty:
                    fund_data[fund_name] = hist['Close'].copy()
                    
                    # Get additional metadata if available
                    info = stock.info
                    metadata[fund_name] = {
                        'expense_ratio': info.get('expenseRatio', None),
                        'fund_size': info.get('totalAssets', None),
                        'fund_manager': info.get('fundFamily', None),
                        'inception_date': info.get('fundInceptionDate', None),
                        'category': info.get('category', None),
                        'description': info.get('longBusinessSummary', None)
                    }
                else:
                    print(f"No data available for {fund_name} ({ticker})")
            except Exception as e:
                print(f"Error fetching data for {fund_name} ({ticker}): {e}")
                
                # Use backup data if configured
                backup_file = self._get_backup_data_path(fund_name)
                if backup_file and os.path.exists(backup_file):
                    try:
                        backup_data = pd.read_csv(backup_file, index_col=0, parse_dates=True)
                        mask = (backup_data.index >= start_date) & (backup_data.index <= end_date)
                        fund_data[fund_name] = backup_data.loc[mask, 'Close']
                        print(f"Using backup data for {fund_name}")
                    except Exception as backup_error:
                        print(f"Error loading backup data for {fund_name}: {backup_error}")
        
        return fund_data, metadata
    
    def _is_cache_valid(self, cache_file: str) -> bool:
        """
        Check if cache file exists and is fresh.
        
        Args:
            cache_file: Path to cache file
            
        Returns:
            True if cache is valid, False otherwise
        """
        if not os.path.exists(cache_file):
            return False
        
        # Check if file is older than cache expiry days
        file_time = os.path.getmtime(cache_file)
        file_date = datetime.fromtimestamp(file_time)
        age_days = (datetime.now() - file_date).days
        
        return age_days <= self.cache_expiry_days
    
    def _get_backup_data_path(self, fund_name: str) -> Optional[str]:
        """
        Get path to backup data file for a fund.
        
        Args:
            fund_name: Name of the fund
            
        Returns:
            Path to backup file or None if not configured
        """
        for fund in self.config["funds"]:
            if fund["name"] == fund_name and "backup_file" in fund:
                return fund["backup_file"]
        return None
    
    def update_fund_config(self, new_fund_config: List[Dict[str, Any]]) -> None:
        """
        Update the fund configuration.
        
        Args:
            new_fund_config: List of fund configurations
        """
        self.config["funds"] = new_fund_config
        
        # Write the updated config to file
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=2)
