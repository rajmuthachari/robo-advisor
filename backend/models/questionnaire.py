"""
Questionnaire Model - Defines the structure for risk assessment questionnaires.
"""
import json
from typing import Dict, List, Tuple, Any, Optional


class Question:
    """Represents a single question in the questionnaire."""
    
    def __init__(self, id: str, text: str, options: List[Dict[str, Any]], section: str = None):
        """
        Initialize a question.
        
        Args:
            id: Unique identifier for the question
            text: The question text
            options: List of options, each with text and score
            section: Optional section this question belongs to
        """
        self.id = id
        self.text = text
        self.options = options
        self.section = section
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "text": self.text,
            "options": self.options,
            "section": self.section
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Question':
        """Create from dictionary representation."""
        return cls(
            id=data["id"],
            text=data["text"],
            options=data["options"],
            section=data.get("section")
        )


class Section:
    """Represents a section of questions in the questionnaire."""
    
    def __init__(self, id: str, title: str, description: str = None, weight: float = 1.0):
        """
        Initialize a section.
        
        Args:
            id: Unique identifier for the section
            title: The section title
            description: Optional description of the section
            weight: Weight of this section in the overall assessment
        """
        self.id = id
        self.title = title
        self.description = description
        self.weight = weight
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "weight": self.weight
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Section':
        """Create from dictionary representation."""
        return cls(
            id=data["id"],
            title=data["title"],
            description=data.get("description"),
            weight=data.get("weight", 1.0)
        )


class Questionnaire:
    """Represents a complete risk assessment questionnaire."""
    
    def __init__(self, id: str, title: str, description: str = None, 
                sections: List[Section] = None, questions: List[Question] = None):
        """
        Initialize a questionnaire.
        
        Args:
            id: Unique identifier for the questionnaire
            title: The questionnaire title
            description: Optional description of the questionnaire
            sections: List of sections
            questions: List of questions
        """
        self.id = id
        self.title = title
        self.description = description
        self.sections = sections or []
        self.questions = questions or []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "sections": [section.to_dict() for section in self.sections],
            "questions": [question.to_dict() for question in self.questions]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Questionnaire':
        """Create from dictionary representation."""
        return cls(
            id=data["id"],
            title=data["title"],
            description=data.get("description"),
            sections=[Section.from_dict(section) for section in data.get("sections", [])],
            questions=[Question.from_dict(question) for question in data.get("questions", [])]
        )
    
    @classmethod
    def load_from_file(cls, file_path: str) -> 'Questionnaire':
        """Load questionnaire from a JSON file."""
        with open(file_path, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)
    
    def save_to_file(self, file_path: str) -> None:
        """Save questionnaire to a JSON file."""
        with open(file_path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    def get_questions_by_section(self, section_id: str) -> List[Question]:
        """Get all questions in a section."""
        return [q for q in self.questions if q.section == section_id]
    
    def get_section_by_id(self, section_id: str) -> Optional[Section]:
        """Get a section by its ID."""
        for section in self.sections:
            if section.id == section_id:
                return section
        return None
    
    def get_question_by_id(self, question_id: str) -> Optional[Question]:
        """Get a question by its ID."""
        for question in self.questions:
            if question.id == question_id:
                return question
        return None


def create_sample_questionnaire(type_name: str = "simple") -> Questionnaire:
    """
    Create a sample questionnaire of the specified type.
    
    Args:
        type_name: Type of questionnaire to create ("simple", "detailed", "section_based")
        
    Returns:
        Sample Questionnaire instance
    """
    if type_name == "simple":
        # Create a simple 10-question questionnaire
        sections = [
            Section(id="goals", title="Financial Goals & Time Horizon", weight=1.2),
            Section(id="situation", title="Financial Situation", weight=1.0),
            Section(id="capacity", title="Risk Capacity", weight=1.5),
            Section(id="attitude", title="Risk Attitude", weight=1.8),
            Section(id="experience", title="Investment Experience & Preferences", weight=1.0)
        ]
        
        questions = [
            Question(
                id="q1",
                text="What is your primary investment objective?",
                options=[
                    {"text": "Preserve my capital", "score": 1},
                    {"text": "Grow my capital steadily over time", "score": 2},
                    {"text": "Maximize long-term returns, accepting short-term risk", "score": 3}
                ],
                section="goals"
            ),
            Question(
                id="q2",
                text="When do you expect to start withdrawing a significant portion of this investment?",
                options=[
                    {"text": "Within 3 years", "score": 1},
                    {"text": "Between 3 and 7 years", "score": 2},
                    {"text": "After 7 years", "score": 3}
                ],
                section="goals"
            ),
            Question(
                id="q3",
                text="How would you describe your household income stability?",
                options=[
                    {"text": "Unstable or fluctuating", "score": 1},
                    {"text": "Mostly stable", "score": 2},
                    {"text": "Very stable and predictable", "score": 3}
                ],
                section="situation"
            ),
            Question(
                id="q4",
                text="Do you have a financial safety net (e.g., emergency fund, insurance)?",
                options=[
                    {"text": "Not at all", "score": 1},
                    {"text": "Partially", "score": 2},
                    {"text": "Fully covered", "score": 3}
                ],
                section="situation"
            ),
            Question(
                id="q5",
                text="How would you react if your portfolio lost 15% in six months?",
                options=[
                    {"text": "Sell immediately to avoid further losses", "score": 1},
                    {"text": "Hold and wait for recovery", "score": 2},
                    {"text": "Buy more to take advantage of lower prices", "score": 3}
                ],
                section="capacity"
            ),
            Question(
                id="q6",
                text="What is the maximum annual loss you could tolerate without changing your investment plan?",
                options=[
                    {"text": "10% or less", "score": 1},
                    {"text": "Around 25%", "score": 2},
                    {"text": "40% or more", "score": 3}
                ],
                section="capacity"
            ),
            Question(
                id="q7",
                text="When markets are volatile, what is your typical reaction?",
                options=[
                    {"text": "I panic and withdraw funds", "score": 1},
                    {"text": "I monitor closely but avoid changing plans", "score": 2},
                    {"text": "I stay calm or see it as an opportunity", "score": 3}
                ],
                section="attitude"
            ),
            Question(
                id="q8",
                text="How do you feel about investment risk?",
                options=[
                    {"text": "I avoid it as much as possible", "score": 1},
                    {"text": "I can handle some risk for moderate returns", "score": 2},
                    {"text": "I am comfortable with high risk for high potential returns", "score": 3}
                ],
                section="attitude"
            ),
            Question(
                id="q9",
                text="Which investments have you used before?",
                options=[
                    {"text": "Only savings, fixed deposits, or insurance", "score": 1},
                    {"text": "Bonds, balanced funds, or REITs", "score": 2},
                    {"text": "Stocks, ETFs, crypto, or derivatives", "score": 3}
                ],
                section="experience"
            ),
            Question(
                id="q10",
                text="How actively do you manage your investments?",
                options=[
                    {"text": "I rarely review or adjust them", "score": 1},
                    {"text": "I occasionally monitor and rebalance", "score": 2},
                    {"text": "I actively manage and adjust strategies", "score": 3}
                ],
                section="experience"
            )
        ]
        
        return Questionnaire(
            id="simple_risk_assessment",
            title="Risk Tolerance Assessment",
            description="This questionnaire will help us understand your risk tolerance and investment goals.",
            sections=sections,
            questions=questions
        )
    
    elif type_name == "detailed":
        # Create a more detailed questionnaire (16 questions)
        # Implementation left for future enhancement
        pass
    
    elif type_name == "section_based":
        # Create a section-based questionnaire
        # Implementation left for future enhancement
        pass
    
    else:
        raise ValueError(f"Unknown questionnaire type: {type_name}")
