"""
Risk Engine - Handles risk assessment logic with configurable approaches.
"""
import json
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Any, Optional


class RiskEngine(ABC):
    """Abstract base class for risk assessment engines."""
    
    @abstractmethod
    def assess_risk(self, responses: List[int]) -> Tuple[str, float]:
        """
        Assess risk based on questionnaire responses.
        
        Args:
            responses: List of integer responses from the questionnaire
            
        Returns:
            Tuple of (risk_profile_name, risk_aversion_parameter)
        """
        pass


class SimpleScoreRiskEngine(RiskEngine):
    """Simple scoring-based risk assessment."""
    
    def __init__(self, config_path: str = "config/risk_profiles/simple_scoring.json"):
        """
        Initialize with configuration file.
        
        Args:
            config_path: Path to risk profile configuration JSON
        """
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def assess_risk(self, responses: List[int]) -> Tuple[str, float]:
        """
        Simple sum-based risk assessment.
        
        Args:
            responses: List of integer responses from the questionnaire
            
        Returns:
            Tuple of (risk_profile_name, risk_aversion_parameter)
        """
        total_score = sum(responses)
        
        # Find the appropriate risk profile based on score ranges
        for profile in self.config["profiles"]:
            if total_score >= profile["min_score"] and total_score <= profile["max_score"]:
                return profile["name"], profile["risk_aversion"]
        
        # Default to most conservative if no match (shouldn't happen with proper config)
        return self.config["profiles"][0]["name"], self.config["profiles"][0]["risk_aversion"]


class WeightedScoreRiskEngine(RiskEngine):
    """Weighted scoring-based risk assessment."""
    
    def __init__(self, config_path: str = "config/risk_profiles/weighted_scoring.json"):
        """
        Initialize with configuration file.
        
        Args:
            config_path: Path to risk profile configuration JSON
        """
        with open(config_path, 'r') as f:
            self.config = json.load(f)
   
    
    def assess_risk(self, responses: Dict[str, int]) -> Tuple[str, float]:
        """
        Assess risk profile based on the notebook's implementation.
        
        Args:
            responses: Dict with question IDs as keys and response scores (1-5) as values
        
        Returns:
            Tuple of (risk_profile_name, risk_aversion_parameter)
        """
        # Extract all response scores
        scores = list(responses.values())
        
        # Calculate total score (sum of all response scores)
        total_score = sum(scores)
        
        # Calculate the final risk score (inverted) - matching the notebook's logic
        # For a 16-question survey with scores 1-5, max total is 80, min is 16
        final_score = 96 - total_score
        
        # Determine risk profile and risk aversion based on final score
        # Using exact thresholds from the notebook
        if final_score >= 76:
            risk_profile = "Aggressive"
            risk_aversion = 1.5
        elif final_score >= 61:
            risk_profile = "Growth-Oriented"
            risk_aversion = 2.5
        elif final_score >= 46:
            risk_profile = "Moderate"
            risk_aversion = 3.5
        elif final_score >= 31:
            risk_profile = "Conservative"
            risk_aversion = 6.0
        else:
            risk_profile = "Very Conservative"
            risk_aversion = 12.0
            
        return risk_profile, risk_aversion


class SectionBasedRiskEngine(RiskEngine):
    """Section-based risk assessment with separate scores for different aspects."""
    
    def __init__(self, config_path: str = "config/risk_profiles/section_based.json"):
        """
        Initialize with configuration file.
        
        Args:
            config_path: Path to risk profile configuration JSON
        """
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def assess_risk(self, responses: List[int]) -> Tuple[str, float]:
        """
        Section-based risk assessment.
        
        Args:
            responses: List of integer responses from the questionnaire
            
        Returns:
            Tuple of (risk_profile_name, risk_aversion_parameter)
        """
        section_scores = {}
        
        # Calculate score for each section
        for section in self.config["sections"]:
            section_name = section["name"]
            question_indices = section["question_indices"]
            section_responses = [responses[i] for i in question_indices]
            section_scores[section_name] = sum(section_responses)
        
        # Apply weights to section scores
        weighted_section_scores = []
        for section in self.config["sections"]:
            section_name = section["name"]
            section_weight = section["weight"]
            weighted_section_scores.append(section_scores[section_name] * section_weight)
        
        final_score = sum(weighted_section_scores)
        
        # Find the appropriate risk profile based on final score
        for profile in self.config["profiles"]:
            if final_score >= profile["min_score"] and final_score <= profile["max_score"]:
                return profile["name"], profile["risk_aversion"]
        
        # Default to most conservative if no match
        return self.config["profiles"][0]["name"], self.config["profiles"][0]["risk_aversion"]


# Factory to create the appropriate risk engine
def create_risk_engine(engine_type: str = "simple") -> RiskEngine:
    """
    Factory function to create risk engine of specified type.
    
    Args:
        engine_type: Type of risk engine to create
        
    Returns:
        Instance of appropriate RiskEngine subclass
    """
    engines = {
        "simple": SimpleScoreRiskEngine,
        "weighted": WeightedScoreRiskEngine,
        "section": SectionBasedRiskEngine
    }
    
    if engine_type not in engines:
        raise ValueError(f"Unknown engine type: {engine_type}. " 
                         f"Available types: {list(engines.keys())}")
    
    return engines[engine_type]()
