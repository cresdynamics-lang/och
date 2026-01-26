"""
Enhanced Profiling Questions for OCH Track Assessment
Comprehensive question set designed for high-accuracy mapping to 5 cybersecurity tracks:
defender, offensive, innovation, leadership, grc
"""
from .profiling import ProfilingQuestion
from .profiling_tracks import OCH_TRACKS

# Technical Aptitude Questions - Focused on cybersecurity skills
TECHNICAL_APTITUDE_QUESTIONS = [
    ProfilingQuestion(
        id="tech_aptitude_1",
        question="When investigating a security incident, your first priority is to:",
        category="technical_aptitude",
        options=[
            {
                "value": "A",
                "text": "Contain the threat and prevent further damage by isolating affected systems",
                "scores": {"defender": 3, "grc": 1, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Understand how the attack worked and identify all vulnerabilities exploited",
                "scores": {"offensive": 3, "defender": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Document the incident according to compliance frameworks and notify stakeholders",
                "scores": {"grc": 3, "leadership": 2, "defender": 1}
            },
            {
                "value": "D",
                "text": "Research the attack techniques to develop new detection methods or tools",
                "scores": {"innovation": 3, "defender": 1, "offensive": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_aptitude_2",
        question="When learning a new security tool or technology, you prefer to:",
        category="technical_aptitude",
        options=[
            {
                "value": "A",
                "text": "Deploy it in a production-like environment and monitor its effectiveness",
                "scores": {"defender": 3, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Test its vulnerabilities and try to bypass its security controls",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Understand its architecture and build a similar or improved version",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Evaluate it against compliance requirements and industry standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_aptitude_3",
        question="Your approach to security monitoring and detection is to:",
        category="technical_aptitude",
        options=[
            {
                "value": "A",
                "text": "Set up comprehensive monitoring systems and analyze logs for anomalies",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Simulate attacks to test detection capabilities and identify blind spots",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Develop AI/ML-based detection algorithms for advanced threat identification",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Define monitoring requirements based on risk assessments and compliance needs",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_aptitude_4",
        question="When faced with a complex security vulnerability, you:",
        category="technical_aptitude",
        options=[
            {
                "value": "A",
                "text": "Assess the risk, prioritize patching, and implement compensating controls",
                "scores": {"defender": 3, "grc": 2, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Exploit it to understand impact and demonstrate proof of concept",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research it deeply and develop novel mitigation techniques or tools",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Document it, assess compliance implications, and coordinate remediation",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    )
]

# Problem-Solving Style Questions - Cybersecurity context
PROBLEM_SOLVING_QUESTIONS = [
    ProfilingQuestion(
        id="problem_solving_1",
        question="Your organization discovers a data breach. Your immediate response is to:",
        category="problem_solving",
        options=[
            {
                "value": "A",
                "text": "Lead the incident response team, coordinate containment, and ensure proper communication",
                "scores": {"leadership": 3, "defender": 2, "grc": 1}
            },
            {
                "value": "B",
                "text": "Analyze the attack vector, trace the adversary's steps, and strengthen defenses",
                "scores": {"defender": 3, "offensive": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Reverse engineer the attack to understand the exploit and develop detection rules",
                "scores": {"offensive": 3, "innovation": 2, "defender": 1}
            },
            {
                "value": "D",
                "text": "Ensure regulatory compliance, document the breach, and coordinate legal/audit requirements",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    ),
    ProfilingQuestion(
        id="problem_solving_2",
        question="When designing security controls for a new system, you prioritize:",
        category="problem_solving",
        options=[
            {
                "value": "A",
                "text": "Defense-in-depth with multiple layers of security controls",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Testing controls through penetration testing and adversarial simulations",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Innovative approaches like zero-trust architecture or AI-powered security",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Alignment with industry frameworks (NIST, ISO 27001) and compliance requirements",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="problem_solving_3",
        question="When managing a security team facing a critical deadline, you:",
        category="problem_solving",
        options=[
            {
                "value": "A",
                "text": "Assess the situation, prioritize tasks, and delegate based on team strengths",
                "scores": {"leadership": 3, "defender": 1}
            },
            {
                "value": "B",
                "text": "Jump into the technical work alongside the team to help solve the problem",
                "scores": {"defender": 3, "offensive": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Explore creative technical solutions and develop automation to accelerate work",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Ensure all work meets compliance standards and document processes properly",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    )
]

# Scenario Preference Questions - Real-world cybersecurity scenarios
SCENARIO_QUESTIONS = [
    ProfilingQuestion(
        id="scenario_1",
        question="You're tasked with improving your organization's security posture. Your approach is to:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Conduct a comprehensive security assessment, identify gaps, and implement layered defenses",
                "scores": {"defender": 3, "grc": 2, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Perform red team exercises and penetration tests to find weaknesses",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Research emerging security technologies and pilot innovative solutions",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Develop a security strategy aligned with business goals and compliance requirements",
                "scores": {"leadership": 3, "grc": 2}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_2",
        question="A zero-day vulnerability is discovered affecting your infrastructure. You:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Immediately assess exposure, apply workarounds, and monitor for exploitation attempts",
                "scores": {"defender": 3, "leadership": 1, "grc": 1}
            },
            {
                "value": "B",
                "text": "Attempt to exploit it in a controlled environment to understand the attack",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research the vulnerability deeply and develop custom detection/mitigation tools",
                "scores": {"innovation": 3, "offensive": 1, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinate the response, ensure regulatory reporting, and manage stakeholder communication",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_3",
        question="You're building a security program from scratch. Your priority is:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Implement foundational security controls and establish monitoring capabilities",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Conduct security assessments and establish regular testing/validation processes",
                "scores": {"offensive": 3, "defender": 2, "grc": 1}
            },
            {
                "value": "C",
                "text": "Adopt cutting-edge security technologies and build custom security tools",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Establish governance framework, policies, and align with industry standards",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    )
]

# Work Style Questions - Cybersecurity professional preferences
WORK_STYLE_QUESTIONS = [
    ProfilingQuestion(
        id="work_style_1",
        question="In your ideal cybersecurity role, you thrive when:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Protecting systems, responding to incidents, and maintaining security operations",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Finding vulnerabilities, exploiting systems ethically, and thinking like an attacker",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Researching new techniques, developing security tools, and solving complex technical challenges",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Leading security initiatives, managing teams, and aligning security with business strategy",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring compliance, managing risk, and working with frameworks and regulations",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_2",
        question="When learning about cybersecurity, you're most energized by:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Hands-on practice with security tools and real-world incident scenarios",
                "scores": {"defender": 3, "offensive": 2}
            },
            {
                "value": "B",
                "text": "Breaking systems, exploiting vulnerabilities, and understanding attack techniques",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Exploring cutting-edge research, new technologies, and building security solutions",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Understanding security strategy, risk management, and business alignment",
                "scores": {"leadership": 3, "grc": 2}
            },
            {
                "value": "E",
                "text": "Studying compliance frameworks, regulations, and industry standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_3",
        question="Your approach to security risk is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Proactive monitoring and prevention through multiple security layers",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Continuous testing and validation through adversarial simulations",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Innovative solutions and research-driven approaches to emerging threats",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Strategic risk management aligned with business objectives and compliance",
                "scores": {"leadership": 3, "grc": 2}
            }
        ]
    )
]

# Cybersecurity Mindset Questions - Deep understanding of security philosophy
CYBERSECURITY_MINDSET_QUESTIONS = [
    ProfilingQuestion(
        id="cyber_mindset_1",
        question="Your philosophy on security is best described as:",
        category="cybersecurity_mindset",
        options=[
            {
                "value": "A",
                "text": "Defense-in-depth: Multiple layers of security controls to protect assets",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Offensive security: Understand attacks to build better defenses",
                "scores": {"offensive": 3, "defender": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Innovation-driven: Leverage emerging technologies to solve security challenges",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Governance-first: Risk-based approach aligned with business and compliance",
                "scores": {"grc": 3, "leadership": 2}
            },
            {
                "value": "E",
                "text": "Strategic alignment: Security as an enabler of business objectives",
                "scores": {"leadership": 3, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="cyber_mindset_2",
        question="When evaluating security technologies, you prioritize:",
        category="cybersecurity_mindset",
        options=[
            {
                "value": "A",
                "text": "Proven effectiveness in detecting and preventing real-world attacks",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Ability to test and validate security controls through adversarial methods",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Innovation potential and ability to solve emerging security challenges",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Compliance with industry standards and integration with governance frameworks",
                "scores": {"grc": 3, "leadership": 1}
            },
            {
                "value": "E",
                "text": "Business value, ROI, and alignment with strategic security objectives",
                "scores": {"leadership": 3, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="cyber_mindset_3",
        question="Your career aspiration in cybersecurity is to:",
        category="cybersecurity_mindset",
        options=[
            {
                "value": "A",
                "text": "Become an expert in security operations, incident response, and defense",
                "scores": {"defender": 3}
            },
            {
                "value": "B",
                "text": "Master offensive security and become a leading penetration tester or red teamer",
                "scores": {"offensive": 3}
            },
            {
                "value": "C",
                "text": "Develop innovative security solutions and contribute to security research",
                "scores": {"innovation": 3}
            },
            {
                "value": "D",
                "text": "Lead security teams and drive organizational security strategy",
                "scores": {"leadership": 3}
            },
            {
                "value": "E",
                "text": "Ensure organizations meet compliance requirements and manage security risk",
                "scores": {"grc": 3}
            }
        ]
    )
]

# Combined question set - Total of 16 questions for comprehensive assessment
ALL_PROFILING_QUESTIONS = (
    TECHNICAL_APTITUDE_QUESTIONS +
    PROBLEM_SOLVING_QUESTIONS +
    SCENARIO_QUESTIONS +
    WORK_STYLE_QUESTIONS +
    CYBERSECURITY_MINDSET_QUESTIONS
)

# Enhanced scoring weights for different categories
CATEGORY_WEIGHTS = {
    "technical_aptitude": 1.3,        # Most important - core technical skills
    "problem_solving": 1.2,           # Very important - how they approach security problems
    "scenario_preference": 1.1,       # Important - real-world scenarios
    "work_style": 1.0,                # Baseline - work preferences
    "cybersecurity_mindset": 1.15     # Very important - security philosophy and career goals
}

# Minimum questions required for valid assessment (at least 12 out of 16 for quality)
MIN_QUESTIONS_FOR_ASSESSMENT = 12
