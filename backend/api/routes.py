"""
API Routes - Flask API endpoints for the robo-advisor.
"""
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any

# Import our engines
from backend.engines.risk_engine import create_risk_engine
from backend.engines.portfolio_engine import create_portfolio_engine
from backend.engines.data_engine import DataEngine
from backend.models.questionnaire import Questionnaire

# Create a blueprint for our API routes
api = Blueprint('api', __name__)

# Initialize engines
data_engine = DataEngine()
risk_engine = create_risk_engine()
portfolio_engine = create_portfolio_engine()

# Load questionnaire
questionnaire = Questionnaire.load_from_file("config/questionnaires/default.json")


@api.route('/questionnaire', methods=['GET'])
def get_questionnaire():
    """Get the questionnaire structure."""
    return jsonify(questionnaire.to_dict())


@api.route('/questionnaire/<questionnaire_id>', methods=['GET'])
def get_specific_questionnaire(questionnaire_id):
    """Get a specific questionnaire by ID."""
    try:
        specific_questionnaire = Questionnaire.load_from_file(f"config/questionnaires/{questionnaire_id}.json")
        return jsonify(specific_questionnaire.to_dict())
    except FileNotFoundError:
        return jsonify({"error": f"Questionnaire with ID {questionnaire_id} not found"}), 404


@api.route('/assess', methods=['POST'])
def assess_risk():
    """Assess risk profile based on questionnaire responses."""
    data = request.json
    
    if not data or 'responses' not in data:
        return jsonify({"error": "Missing responses in request"}), 400
    
    responses = data['responses']
    
    # Use specified risk engine or default
    engine_type = data.get('engine_type', 'simple')
    risk_engine = create_risk_engine(engine_type)
    
    # Assess risk profile
    try:
        profile_name, risk_aversion = risk_engine.assess_risk(responses)
        
        return jsonify({
            "profile": profile_name,
            "risk_aversion": risk_aversion
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/recommend', methods=['POST'])
def recommend_portfolio():
    """Generate portfolio recommendations based on risk profile."""
    data = request.json
    
    if not data or 'risk_aversion' not in data:
        return jsonify({"error": "Missing risk_aversion in request"}), 400
    
    risk_aversion = data['risk_aversion']
    
    # Get fund data
    try:
        prices_df, _ = data_engine.get_fund_data()
        returns_df = data_engine.calculate_returns(prices_df)
        
        # Calculate metrics
        metrics_df = data_engine.calculate_metrics(returns_df)
        
        # Calculate mean returns and covariance matrix
        mean_returns = returns_df.mean() * 252  # Annualized
        cov_matrix = returns_df.cov() * 252  # Annualized
        
        # Use the notebook's direct approach
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
        allow_short = data.get('allow_short', False)
        if allow_short:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        else:
            bounds = tuple((0, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_weights = np.array([1/n_assets] * n_assets)
        
        # Optimize
        from scipy.optimize import minimize
        result = minimize(utility, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)
        
        # Calculate portfolio statistics
        optimal_weights = pd.Series(result['x'], index=mean_returns.index)
        portfolio_return = np.sum(mean_returns * optimal_weights)
        portfolio_volatility = np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))
        sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Filter out small allocations
        min_alloc = 0.01  # 1% minimum allocation
        significant_weights = optimal_weights[optimal_weights >= min_alloc]
        if len(significant_weights) > 0:
            # Normalize to ensure they sum to 1
            significant_weights = significant_weights / significant_weights.sum()
        else:
            significant_weights = optimal_weights
        
        # Add metrics for recommended funds
        portfolio_funds = list(significant_weights.index)
        fund_metrics = metrics_df.loc[portfolio_funds].to_dict('index')
        
        return jsonify({
            "portfolio": {
                "weights": significant_weights.to_dict(),
                "return": portfolio_return,
                "volatility": portfolio_volatility,
                "sharpe_ratio": sharpe_ratio,
                "fund_metrics": fund_metrics
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/funds', methods=['GET'])
def get_funds():
    """Get the list of available funds."""
    try:
        funds = data_engine.get_fund_list()
        return jsonify({"funds": funds})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/funds/metrics', methods=['GET'])
def get_fund_metrics():
    """Get performance metrics for all funds."""
    try:
        prices_df, metadata = data_engine.get_fund_data()
        returns_df = data_engine.calculate_returns(prices_df)
        metrics_df = data_engine.calculate_metrics(returns_df)
        
        # Convert to dictionary for JSON response
        metrics_dict = metrics_df.to_dict('index')
        
        # Add metadata to response
        for fund in metrics_dict:
            if fund in metadata:
                metrics_dict[fund]['metadata'] = metadata[fund]
        
        return jsonify({"metrics": metrics_dict})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/profiles', methods=['GET'])
def get_risk_profiles():
    """Get the list of available risk profiles."""
    try:
        with open("config/risk_profiles/simple_scoring.json", 'r') as f:
            profiles = json.load(f)['profiles']
        
        return jsonify({"profiles": profiles})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/complete', methods=['POST'])
def complete_assessment():
    """Complete the full assessment process."""
    data = request.json
    
    if not data or 'responses' not in data:
        return jsonify({"error": "Missing responses in request"}), 400
    
    responses = data['responses']
    
    try:
        # 1. Assess risk profile
        risk_engine_type = data.get('risk_engine_type', 'simple')
        risk_engine = create_risk_engine(risk_engine_type)
        profile_name, risk_aversion = risk_engine.assess_risk(responses)
        
        # 2. Generate portfolio recommendation
        # Get fund data
        prices_df, metadata = data_engine.get_fund_data()
        returns_df = data_engine.calculate_returns(prices_df)
        
        # Calculate mean returns and covariance matrix
        mean_returns = returns_df.mean() * 252  # Annualized
        cov_matrix = returns_df.cov() * 252  # Annualized
        
        # Using the direct notebook approach for portfolio construction
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
        allow_short = data.get('allow_short', False)
        if allow_short:
            bounds = tuple((-1, 1) for _ in range(n_assets))
        else:
            bounds = tuple((0, 1) for _ in range(n_assets))
        
        # Initial guess
        initial_weights = np.array([1/n_assets] * n_assets)
        
        # Optimize
        from scipy.optimize import minimize
        result = minimize(utility, initial_weights, method='SLSQP', bounds=bounds, constraints=constraints)
        
        # Calculate portfolio statistics
        optimal_weights = pd.Series(result['x'], index=mean_returns.index)
        portfolio_return = np.sum(mean_returns * optimal_weights)
        portfolio_volatility = np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))
        sharpe_ratio = portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Filter out small allocations
        min_alloc = 0.01  # 1% minimum allocation
        significant_weights = optimal_weights[optimal_weights >= min_alloc]
        if len(significant_weights) > 0:
            # Normalize to ensure they sum to 1
            significant_weights = significant_weights / significant_weights.sum()
        else:
            significant_weights = optimal_weights
            
        # Add metrics for recommended funds
        metrics_df = data_engine.calculate_metrics(returns_df)
        portfolio_funds = list(significant_weights.index)
        fund_metrics = metrics_df.loc[portfolio_funds].to_dict('index')
        
        # 3. Prepare response with all information
        result = {
            "risk_assessment": {
                "profile": profile_name,
                "risk_aversion": risk_aversion
            },
            "portfolio": {
                "weights": significant_weights.to_dict(),
                "return": portfolio_return,
                "volatility": portfolio_volatility,
                "sharpe_ratio": sharpe_ratio
            },
            "funds": {
                fund: {
                    "metrics": fund_metrics.get(fund, {}),
                    "metadata": metadata.get(fund, {})
                } for fund in portfolio_funds
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/efficient-frontier', methods=['GET'])
def get_efficient_frontier():
    """Generate the efficient frontier using the notebook's implementation."""
    try:
        prices_df, _ = data_engine.get_fund_data()
        returns_df = data_engine.calculate_returns(prices_df)
        
        # Calculate covariance matrix
        cov_matrix = returns_df.cov() * 252  # Annualized
        
        # Annualized mean returns
        mean_returns = returns_df.mean() * 252
        
        # Number of assets
        n_assets = len(mean_returns)
        
        # Function to minimize portfolio volatility for a given target return
        def portfolio_volatility(weights, cov_matrix):
            return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        
        # Function to calculate portfolio return
        def portfolio_return(weights, mean_returns):
            return np.sum(mean_returns * weights)
        
        # Function for portfolio volatility optimization
        def min_volatility(target_return, mean_returns, cov_matrix, constraint_set):
            # Objective function (minimize volatility)
            def objective(weights):
                return portfolio_volatility(weights, cov_matrix)
            
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
            from scipy.optimize import minimize
            result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
            
            return result['fun'], result['x']
        
        # Find the Global Minimum Variance Portfolio (GMVP)
        def find_gmvp(mean_returns, cov_matrix, constraint_set):
            # Objective function (minimize volatility)
            def objective(weights):
                return portfolio_volatility(weights, cov_matrix)
            
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
            from scipy.optimize import minimize
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
                port_volatility = portfolio_volatility(weights, cov_matrix)
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
            from scipy.optimize import minimize
            result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints)
            
            return {
                'volatility': portfolio_volatility(result['x'], cov_matrix),
                'return': portfolio_return(result['x'], mean_returns),
                'weights': result['x'],
                'sharpe': (portfolio_return(result['x'], mean_returns) - rf_rate) / 
                         portfolio_volatility(result['x'], cov_matrix)
            }
        
        # Define constraint sets for with and without short sales
        constraint_set_with_short = {'sum'}
        constraint_set_no_short = {'sum', 'long_only'}
        
        # Risk-free rate
        rf_rate = 0.03
        
        # Results for with short sales allowed
        gmvp_with_short = find_gmvp(mean_returns, cov_matrix, constraint_set_with_short)
        market_portfolio_with_short = find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set_with_short)
        
        # Results for without short sales
        gmvp_no_short = find_gmvp(mean_returns, cov_matrix, constraint_set_no_short)
        market_portfolio_no_short = find_market_portfolio(mean_returns, cov_matrix, rf_rate, constraint_set_no_short)
        
        # Extract key information for the response
        response = {
            "gmvp_with_short": {
                "return": float(gmvp_with_short['return']),
                "volatility": float(gmvp_with_short['volatility']),
                "weights": {
                    fund: float(weight) for fund, weight in
                    zip(returns_df.columns, gmvp_with_short['weights'])
                }
            },
            "gmvp_no_short": {
                "return": float(gmvp_no_short['return']),
                "volatility": float(gmvp_no_short['volatility']),
                "weights": {
                    fund: float(weight) for fund, weight in
                    zip(returns_df.columns, gmvp_no_short['weights'])
                }
            },
            "market_portfolio_with_short": {
                "return": float(market_portfolio_with_short['return']),
                "volatility": float(market_portfolio_with_short['volatility']),
                "sharpe_ratio": float(market_portfolio_with_short['sharpe']),
                "weights": {
                    fund: float(weight) for fund, weight in
                    zip(returns_df.columns, market_portfolio_with_short['weights'])
                }
            },
            "market_portfolio_no_short": {
                "return": float(market_portfolio_no_short['return']),
                "volatility": float(market_portfolio_no_short['volatility']),
                "sharpe_ratio": float(market_portfolio_no_short['sharpe']),
                "weights": {
                    fund: float(weight) for fund, weight in
                    zip(returns_df.columns, market_portfolio_no_short['weights'])
                }
            }
        }
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def create_app():
    """Create and configure the Flask app."""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Register blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
