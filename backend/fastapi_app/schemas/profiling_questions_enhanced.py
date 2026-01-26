"""
Enhanced Profiling Questions for OCH Tier-0 Profiler
7 comprehensive modules mapping users to 5 cybersecurity tracks:
defender, offensive, innovation, leadership, grc

Modules:
1. Identity & Value (VIP-based questions) - 10-15 questions
2. Cyber Aptitude (logic, patterns, reasoning) - 10-15 questions
3. Technical Exposure (multiple-choice & experience scoring) - 10-15 questions
4. Scenario Preferences (choose-your-path mini-stories) - 10-15 questions
5. Work Style & Behavioral Profile - 10-15 questions
6. Difficulty Level Self-Selection - 1 question with AI verification
7. Role Fit Reflection - 2 open-ended questions
"""
from .profiling import ProfilingQuestion
from .profiling_tracks import OCH_TRACKS

# ============================================================================
# MODULE 1: Identity & Value (VIP-based questions)
# Extract Value Statement and understand user's core motivations
# ============================================================================
IDENTITY_VALUE_QUESTIONS = [
    ProfilingQuestion(
        id="identity_1",
        question="What drives you most in your career?",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Protecting others and ensuring systems are secure",
                "scores": {"defender": 3, "grc": 1, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Understanding how things work and finding vulnerabilities",
                "scores": {"offensive": 3, "innovation": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Creating innovative solutions and pushing boundaries",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Leading teams and making strategic decisions",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring compliance and managing risk systematically",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_2",
        question="Your ideal work environment is one where:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "You monitor systems and respond to security incidents in real-time",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "You test systems, find vulnerabilities, and think like an attacker",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "You research, develop tools, and explore cutting-edge technologies",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "You coordinate teams, make strategic decisions, and align security with business",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "You work with frameworks, ensure compliance, and manage risk",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_3",
        question="When you think about cybersecurity, what excites you most?",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Building robust defenses and protecting organizations from attacks",
                "scores": {"defender": 3, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Breaking into systems ethically and understanding attack techniques",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Developing new security technologies and solving complex problems",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Leading security initiatives and making strategic impact",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring organizations meet security standards and regulations",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_4",
        question="Your core value in cybersecurity is:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Vigilance and protection - being the first line of defense",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Discovery and validation - finding weaknesses before attackers do",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Innovation and advancement - creating the future of security",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategy and leadership - aligning security with business success",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Governance and compliance - ensuring systematic security management",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_5",
        question="What impact do you want to make in cybersecurity?",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Protect organizations from cyber threats and minimize security incidents",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Help organizations identify and fix security vulnerabilities proactively",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Develop breakthrough security technologies and advance the field",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Lead security teams and drive organizational security strategy",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure organizations meet compliance requirements and manage risk effectively",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    # Additional identity questions (10-15 total)
    ProfilingQuestion(
        id="identity_6",
        question="Your approach to learning cybersecurity is:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Hands-on practice with security tools and real incident scenarios",
                "scores": {"defender": 3, "offensive": 2}
            },
            {
                "value": "B",
                "text": "Breaking things, exploiting vulnerabilities, and understanding attacks",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research, experimentation, and building security solutions",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Understanding strategy, risk management, and business alignment",
                "scores": {"leadership": 3, "grc": 2}
            },
            {
                "value": "E",
                "text": "Studying frameworks, regulations, and compliance standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_7",
        question="In a cybersecurity crisis, your natural role is:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Incident responder - contain, analyze, and remediate the threat",
                "scores": {"defender": 3, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Forensic investigator - trace the attack and understand the methodology",
                "scores": {"offensive": 3, "defender": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Tool developer - create solutions to detect and prevent similar attacks",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Crisis coordinator - lead the response and manage stakeholder communication",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Compliance officer - ensure proper reporting and regulatory requirements",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_8",
        question="Your ideal cybersecurity project involves:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Building and maintaining security monitoring systems",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Penetration testing and security assessments",
                "scores": {"offensive": 3, "defender": 1}
            },
            {
                "value": "C",
                "text": "Research and development of new security technologies",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic planning and program management",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Risk assessment and compliance implementation",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_9",
        question="When working on security challenges, you're most energized by:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Detecting and responding to threats in real-time",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Finding and exploiting vulnerabilities",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Creating innovative solutions to security problems",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Coordinating teams and making strategic decisions",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring systematic compliance and risk management",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="identity_10",
        question="Your cybersecurity philosophy is:",
        category="identity_value",
        options=[
            {
                "value": "A",
                "text": "Defense-in-depth: Multiple layers of protection",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Know your enemy: Understand attacks to build better defenses",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Innovation-driven: Technology advances security",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategy-first: Security enables business success",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Governance-based: Framework-driven security management",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
]

# ============================================================================
# MODULE 2: Cyber Aptitude (logic, patterns, reasoning)
# Pattern recognition, logical reasoning, basic cybersecurity concepts
# ============================================================================
CYBER_APTITUDE_QUESTIONS = [
    ProfilingQuestion(
        id="aptitude_1",
        question="You notice unusual network traffic patterns. Your first step is to:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Isolate the affected systems and analyze the traffic logs",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Attempt to replicate the traffic pattern to understand the attack",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Develop automated detection rules for similar patterns",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Assess the risk and coordinate the response team",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Document the incident and check compliance requirements",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_2",
        question="A security alert shows multiple failed login attempts. You:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Block the IP addresses and investigate the source",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Analyze the attack pattern and test if the system is vulnerable",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Develop an automated response system for future attempts",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinate with the team to assess impact and response",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Document the incident and ensure compliance with security policies",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_3",
        question="You discover a zero-day vulnerability. Your priority is:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Assess impact, apply workarounds, and monitor for exploitation",
                "scores": {"defender": 3, "leadership": 1, "grc": 1}
            },
            {
                "value": "B",
                "text": "Create a proof-of-concept exploit to demonstrate the risk",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research the vulnerability and develop detection/mitigation tools",
                "scores": {"innovation": 3, "offensive": 1, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinate response, communicate risk, and manage stakeholder expectations",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Document the vulnerability, assess compliance impact, and ensure proper reporting",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_4",
        question="When analyzing a malware sample, you focus on:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Understanding its behavior and creating detection signatures",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Reverse engineering to understand the attack methodology",
                "scores": {"offensive": 3, "innovation": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Developing automated analysis tools and detection systems",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinating the analysis team and managing the investigation",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Documenting the threat and ensuring compliance with security policies",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_5",
        question="A security policy needs updating. Your approach is:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Review current threats and update controls accordingly",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Test the policy by attempting to bypass it",
                "scores": {"offensive": 3, "defender": 1}
            },
            {
                "value": "C",
                "text": "Develop automated policy enforcement tools",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Lead the policy review process and align with business objectives",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure the policy aligns with compliance frameworks and regulations",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    # Additional aptitude questions (10-15 total)
    ProfilingQuestion(
        id="aptitude_6",
        question="You need to secure a new cloud deployment. You:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Implement security controls and monitoring from the start",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Perform security testing and penetration testing",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Develop custom security tools for cloud-specific threats",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Develop a security strategy aligned with business requirements",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure compliance with cloud security frameworks and standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_7",
        question="A pattern in security logs suggests an advanced persistent threat. You:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Investigate the pattern, create detection rules, and monitor closely",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Analyze the attack techniques and test defensive capabilities",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Develop AI/ML-based detection for similar advanced threats",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinate threat intelligence and response strategy",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Assess the risk and ensure compliance with threat reporting requirements",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_8",
        question="You're designing a security architecture. Your priority is:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Defense-in-depth with multiple security layers",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Testability and validation through security assessments",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Innovative security technologies and automation",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Alignment with business strategy and risk management",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Compliance with security frameworks and standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_9",
        question="When analyzing network traffic, you look for:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Anomalies, suspicious patterns, and indicators of compromise",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Attack vectors, exploitation attempts, and security weaknesses",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Patterns that can be automated for detection and response",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Risk indicators and business impact",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Compliance violations and policy breaches",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="aptitude_10",
        question="A security incident requires immediate response. Your strength is:",
        category="cyber_aptitude",
        options=[
            {
                "value": "A",
                "text": "Rapid containment and forensic analysis",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Understanding attack methodology and identifying all entry points",
                "scores": {"offensive": 3, "defender": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Developing tools to automate response and detection",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinating the response team and managing the crisis",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring proper documentation and compliance reporting",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
]

# ============================================================================
# MODULE 3: Technical Exposure (multiple-choice & experience scoring)
# Self-rating questions about technical knowledge and experience
# ============================================================================
TECHNICAL_EXPOSURE_QUESTIONS = [
    ProfilingQuestion(
        id="tech_exposure_1",
        question="Your experience with security monitoring tools (SIEM, EDR) is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I use them daily and understand advanced features",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I've used them and understand the basics",
                "scores": {"defender": 2, "offensive": 1, "grc": 1}
            },
            {
                "value": "C",
                "text": "Limited - I know what they are but haven't used them much",
                "scores": {"offensive": 1, "innovation": 1, "leadership": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to security monitoring",
                "scores": {"leadership": 1, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_2",
        question="Your experience with penetration testing tools (Metasploit, Burp Suite) is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I use them regularly for security assessments",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I've used them and understand the basics",
                "scores": {"offensive": 2, "defender": 1, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Limited - I know what they are but haven't used them much",
                "scores": {"defender": 1, "innovation": 1, "leadership": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to penetration testing",
                "scores": {"leadership": 1, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_3",
        question="Your programming/scripting experience is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Advanced - I develop security tools and automation scripts",
                "scores": {"innovation": 3, "offensive": 2, "defender": 1}
            },
            {
                "value": "B",
                "text": "Intermediate - I can write scripts and understand code",
                "scores": {"innovation": 2, "offensive": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Basic - I understand programming concepts but limited practice",
                "scores": {"defender": 1, "offensive": 1, "leadership": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to programming",
                "scores": {"leadership": 1, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_4",
        question="Your knowledge of compliance frameworks (ISO 27001, NIST, SOC 2) is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I've implemented and audited compliance programs",
                "scores": {"grc": 3, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I understand the frameworks and their requirements",
                "scores": {"grc": 2, "leadership": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Basic - I know what they are but limited experience",
                "scores": {"defender": 1, "leadership": 1, "offensive": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to compliance frameworks",
                "scores": {"offensive": 1, "innovation": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_5",
        question="Your experience with security risk assessment is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I regularly perform risk assessments and manage risk",
                "scores": {"grc": 3, "leadership": 2, "defender": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I understand risk assessment methodologies",
                "scores": {"grc": 2, "leadership": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Basic - I know the concepts but limited practice",
                "scores": {"defender": 1, "offensive": 1, "innovation": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to risk assessment",
                "scores": {"offensive": 1, "innovation": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_6",
        question="Your experience leading security teams or projects is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I regularly lead teams and manage security programs",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I've led small teams or projects",
                "scores": {"leadership": 2, "grc": 1, "defender": 1}
            },
            {
                "value": "C",
                "text": "Basic - I've coordinated with others but not formally led",
                "scores": {"defender": 1, "offensive": 1, "innovation": 1}
            },
            {
                "value": "D",
                "text": "None - I've primarily worked independently",
                "scores": {"offensive": 1, "innovation": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_7",
        question="Your knowledge of network security and protocols is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Advanced - I deeply understand networking and security protocols",
                "scores": {"defender": 3, "offensive": 2, "innovation": 1}
            },
            {
                "value": "B",
                "text": "Intermediate - I understand networking basics and security concepts",
                "scores": {"defender": 2, "offensive": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Basic - I know the fundamentals",
                "scores": {"defender": 1, "leadership": 1, "grc": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to networking",
                "scores": {"leadership": 1, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_8",
        question="Your experience with cloud security (AWS, Azure, GCP) is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I've secured cloud environments and understand best practices",
                "scores": {"defender": 3, "innovation": 2, "offensive": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I understand cloud security concepts",
                "scores": {"defender": 2, "innovation": 2, "offensive": 1}
            },
            {
                "value": "C",
                "text": "Basic - I know the basics of cloud security",
                "scores": {"defender": 1, "leadership": 1, "grc": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to cloud security",
                "scores": {"leadership": 1, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_9",
        question="Your experience with security research and development is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Extensive - I regularly conduct security research and develop tools",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I've done some research and tool development",
                "scores": {"innovation": 2, "offensive": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Basic - I understand research concepts but limited practice",
                "scores": {"offensive": 1, "defender": 1, "leadership": 1}
            },
            {
                "value": "D",
                "text": "None - I'm new to security research",
                "scores": {"leadership": 1, "grc": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="tech_exposure_10",
        question="Your overall cybersecurity experience level is:",
        category="technical_exposure",
        options=[
            {
                "value": "A",
                "text": "Advanced - 5+ years of professional cybersecurity experience",
                "scores": {"defender": 2, "offensive": 2, "innovation": 2, "leadership": 2, "grc": 2}
            },
            {
                "value": "B",
                "text": "Intermediate - 2-5 years of experience",
                "scores": {"defender": 2, "offensive": 2, "innovation": 2, "leadership": 1, "grc": 1}
            },
            {
                "value": "C",
                "text": "Beginner - 1-2 years of experience or self-study",
                "scores": {"defender": 1, "offensive": 1, "innovation": 1, "leadership": 1, "grc": 1}
            },
            {
                "value": "D",
                "text": "Novice - New to cybersecurity",
                "scores": {"defender": 1, "offensive": 1, "innovation": 1, "leadership": 1, "grc": 1}
            }
        ]
    ),
]

# ============================================================================
# MODULE 4: Scenario Preferences (choose-your-path mini-stories)
# Branching story format - user chooses action in cyber events
# ============================================================================
SCENARIO_PREFERENCE_QUESTIONS = [
    ProfilingQuestion(
        id="scenario_1",
        question="You discover a critical vulnerability in production. Your action is:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Immediately patch and deploy security controls",
                "scores": {"defender": 3, "grc": 1, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Create a proof-of-concept exploit to demonstrate the risk",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research the vulnerability and develop detection/mitigation tools",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Assess business impact and coordinate remediation strategy",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Document the vulnerability and ensure compliance reporting",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_2",
        question="During a security incident, you're most effective when:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Analyzing logs and containing the threat",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Reverse engineering the attack to understand the methodology",
                "scores": {"offensive": 3, "innovation": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Developing tools to automate detection and response",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinating the team and managing stakeholder communication",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring proper documentation and compliance requirements",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_3",
        question="You're building a new security program. Your approach is:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Implement foundational security controls and monitoring",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Conduct security assessments and establish testing processes",
                "scores": {"offensive": 3, "defender": 2, "grc": 1}
            },
            {
                "value": "C",
                "text": "Adopt cutting-edge technologies and build custom tools",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Develop a strategic security framework aligned with business",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Establish governance framework and compliance standards",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_4",
        question="A zero-day is being actively exploited. You:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Assess exposure, apply workarounds, and monitor for attacks",
                "scores": {"defender": 3, "leadership": 1, "grc": 1}
            },
            {
                "value": "B",
                "text": "Attempt to exploit it to understand the attack vector",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research it and develop custom detection/mitigation",
                "scores": {"innovation": 3, "offensive": 1, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinate response and manage stakeholder communication",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure regulatory reporting and compliance requirements",
                "scores": {"grc": 3, "leadership": 2}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_5",
        question="You're asked to improve security posture. You prioritize:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Implementing security controls and monitoring systems",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Conducting security assessments and penetration testing",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Researching and implementing innovative security solutions",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Developing a strategic security plan aligned with business",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring compliance with security frameworks and standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    # Additional scenario questions (10-15 total)
    ProfilingQuestion(
        id="scenario_6",
        question="A security breach is discovered. Your first action is:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Contain the breach and begin forensic analysis",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Analyze the attack methodology and identify all entry points",
                "scores": {"offensive": 3, "defender": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Develop tools to detect and prevent similar attacks",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Lead the incident response and coordinate the team",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure proper documentation and regulatory compliance",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_7",
        question="You're evaluating a new security technology. Your approach is:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Test its effectiveness in detecting and preventing attacks",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Attempt to bypass it and test its security controls",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Research its architecture and build an improved version",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Assess its business value and strategic alignment",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Evaluate it against compliance requirements and standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_8",
        question="A security policy needs enforcement. You:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Implement technical controls to enforce the policy",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Test the policy by attempting to bypass it",
                "scores": {"offensive": 3, "defender": 1}
            },
            {
                "value": "C",
                "text": "Develop automated enforcement tools",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinate policy implementation and team alignment",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure policy aligns with compliance frameworks",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_9",
        question="You're responding to a phishing campaign. You focus on:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Blocking malicious emails and monitoring for compromises",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Analyzing the attack to understand the phishing techniques",
                "scores": {"offensive": 3, "defender": 2}
            },
            {
                "value": "C",
                "text": "Developing automated detection for similar campaigns",
                "scores": {"innovation": 3, "defender": 1}
            },
            {
                "value": "D",
                "text": "Coordinating awareness training and response strategy",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensuring compliance with email security policies",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="scenario_10",
        question="You're designing security training. Your approach is:",
        category="scenario_preference",
        options=[
            {
                "value": "A",
                "text": "Focus on practical security awareness and incident response",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Include hands-on security testing and ethical hacking",
                "scores": {"offensive": 3, "defender": 1}
            },
            {
                "value": "C",
                "text": "Cover emerging threats and innovative security solutions",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Align training with business objectives and risk management",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure training meets compliance and regulatory requirements",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
]

# ============================================================================
# MODULE 5: Work Style & Behavioral Profile
# Stability vs Exploration, Detail orientation, Communication preferences
# ============================================================================
WORK_STYLE_QUESTIONS = [
    ProfilingQuestion(
        id="work_style_1",
        question="Your preferred work style is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Structured and systematic - I prefer clear processes and procedures",
                "scores": {"defender": 3, "grc": 2, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Exploratory and adaptive - I enjoy discovering new approaches",
                "scores": {"offensive": 3, "innovation": 2}
            },
            {
                "value": "C",
                "text": "Creative and innovative - I like building new solutions",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic and collaborative - I excel at coordinating teams",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Methodical and detail-oriented - I ensure thoroughness and compliance",
                "scores": {"grc": 3, "defender": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_2",
        question="When facing uncertainty, you:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Rely on established procedures and best practices",
                "scores": {"defender": 3, "grc": 2, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Experiment and test different approaches",
                "scores": {"offensive": 3, "innovation": 2}
            },
            {
                "value": "C",
                "text": "Research and develop innovative solutions",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Assess the situation and make strategic decisions",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Follow frameworks and compliance guidelines",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_3",
        question="Your communication style is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Technical and precise - I focus on facts and details",
                "scores": {"defender": 3, "offensive": 2, "innovation": 1}
            },
            {
                "value": "B",
                "text": "Analytical and investigative - I explain how things work",
                "scores": {"offensive": 3, "innovation": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Innovative and forward-thinking - I discuss new possibilities",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic and persuasive - I align technical with business",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Structured and formal - I ensure clarity and compliance",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_4",
        question="Your approach to problem-solving is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Systematic - I follow established methodologies",
                "scores": {"defender": 3, "grc": 2, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Exploratory - I test different approaches to find solutions",
                "scores": {"offensive": 3, "innovation": 2}
            },
            {
                "value": "C",
                "text": "Innovative - I create new approaches to solve problems",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic - I consider multiple factors and make decisions",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Methodical - I ensure thorough analysis and compliance",
                "scores": {"grc": 3, "defender": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_5",
        question="Your attention to detail is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "High - I meticulously review everything",
                "scores": {"defender": 3, "grc": 3, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Focused - I pay attention to critical details",
                "scores": {"offensive": 3, "defender": 2, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Selective - I focus on innovative aspects",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic - I focus on high-impact details",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Comprehensive - I ensure all requirements are met",
                "scores": {"grc": 3, "defender": 1}
            }
        ]
    ),
    # Additional work style questions (10-15 total)
    ProfilingQuestion(
        id="work_style_6",
        question="When working on a team project, you prefer to:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Focus on technical implementation and security controls",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Test and validate security through adversarial methods",
                "scores": {"offensive": 3, "defender": 1}
            },
            {
                "value": "C",
                "text": "Develop innovative solutions and tools",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Lead the team and coordinate efforts",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Ensure compliance and documentation",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_7",
        question="Your risk tolerance is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Low - I prefer proven, safe approaches",
                "scores": {"defender": 3, "grc": 2, "leadership": 1}
            },
            {
                "value": "B",
                "text": "Moderate - I take calculated risks in testing",
                "scores": {"offensive": 3, "innovation": 2, "defender": 1}
            },
            {
                "value": "C",
                "text": "Higher - I explore innovative but unproven solutions",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic - I balance risk with business objectives",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Controlled - I manage risk through frameworks",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_8",
        question="Your learning preference is:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Hands-on practice with real-world scenarios",
                "scores": {"defender": 3, "offensive": 2}
            },
            {
                "value": "B",
                "text": "Breaking things and understanding how they work",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research and experimentation with new technologies",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic learning aligned with career goals",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Structured learning through frameworks and standards",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_9",
        question="When making decisions, you rely on:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Technical data and security metrics",
                "scores": {"defender": 3, "grc": 1}
            },
            {
                "value": "B",
                "text": "Testing results and proof of concept",
                "scores": {"offensive": 3, "innovation": 1}
            },
            {
                "value": "C",
                "text": "Research findings and innovative approaches",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic analysis and business alignment",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Compliance requirements and risk assessments",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
    ProfilingQuestion(
        id="work_style_10",
        question="Your ideal work environment emphasizes:",
        category="work_style",
        options=[
            {
                "value": "A",
                "text": "Stability and established security operations",
                "scores": {"defender": 3, "grc": 2}
            },
            {
                "value": "B",
                "text": "Continuous testing and validation",
                "scores": {"offensive": 3, "defender": 1}
            },
            {
                "value": "C",
                "text": "Innovation and research opportunities",
                "scores": {"innovation": 3, "offensive": 1}
            },
            {
                "value": "D",
                "text": "Strategic leadership and business impact",
                "scores": {"leadership": 3, "grc": 1}
            },
            {
                "value": "E",
                "text": "Compliance and governance frameworks",
                "scores": {"grc": 3, "leadership": 1}
            }
        ]
    ),
]

# ============================================================================
# MODULE 6: Difficulty Level Self-Selection
# User selects their difficulty level (Novice/Beginner/Intermediate/Advanced/Elite)
# AI engine verifies if selection is realistic based on responses
# ============================================================================
DIFFICULTY_SELECTION_QUESTIONS = [
    ProfilingQuestion(
        id="difficulty_selection",
        question="Based on your experience and responses, what difficulty level do you feel ready for?",
        category="difficulty_selection",
        options=[
            {
                "value": "novice",
                "text": "Novice - I'm completely new to cybersecurity",
                "scores": {"defender": 1, "offensive": 1, "innovation": 1, "leadership": 1, "grc": 1}
            },
            {
                "value": "beginner",
                "text": "Beginner - I have basic knowledge and want to build fundamentals",
                "scores": {"defender": 1, "offensive": 1, "innovation": 1, "leadership": 1, "grc": 1}
            },
            {
                "value": "intermediate",
                "text": "Intermediate - I have some experience and want to advance",
                "scores": {"defender": 2, "offensive": 2, "innovation": 2, "leadership": 2, "grc": 2}
            },
            {
                "value": "advanced",
                "text": "Advanced - I have significant experience and want to master skills",
                "scores": {"defender": 3, "offensive": 3, "innovation": 3, "leadership": 3, "grc": 3}
            },
            {
                "value": "elite",
                "text": "Elite - I'm an expert and want to tackle the most challenging content",
                "scores": {"defender": 3, "offensive": 3, "innovation": 3, "leadership": 3, "grc": 3}
            }
        ]
    ),
]

# ============================================================================
# MODULE 7: Role Fit Reflection (Open-ended questions)
# "Why cyber?" and "What do you want to achieve?"
# Stored as portfolio entry
# ============================================================================
# Note: These are handled separately as text responses, not multiple choice
# They will be stored in the session metadata and used for value statement extraction

# ============================================================================
# Combined Question Set
# ============================================================================
ALL_PROFILING_QUESTIONS_ENHANCED = (
    IDENTITY_VALUE_QUESTIONS +
    CYBER_APTITUDE_QUESTIONS +
    TECHNICAL_EXPOSURE_QUESTIONS +
    SCENARIO_PREFERENCE_QUESTIONS +
    WORK_STYLE_QUESTIONS +
    DIFFICULTY_SELECTION_QUESTIONS
)

# Enhanced scoring weights for Tier-0 requirements
CATEGORY_WEIGHTS_ENHANCED = {
    "identity_value": 1.0,           # Baseline - understanding core motivations
    "cyber_aptitude": 1.3,            # Most important - technical reasoning
    "technical_exposure": 1.2,        # Very important - past experience
    "scenario_preference": 1.2,       # Very important - real-world choices
    "work_style": 1.1,                # Important - behavioral preferences
    "difficulty_selection": 0.8,      # Lower weight - self-assessment
}

# Minimum questions required (at least 12 out of ~50 for quality assessment)
MIN_QUESTIONS_FOR_ASSESSMENT_ENHANCED = 12

# Export for use in profiling service
__all__ = [
    'ALL_PROFILING_QUESTIONS_ENHANCED',
    'CATEGORY_WEIGHTS_ENHANCED',
    'MIN_QUESTIONS_FOR_ASSESSMENT_ENHANCED',
    'IDENTITY_VALUE_QUESTIONS',
    'CYBER_APTITUDE_QUESTIONS',
    'TECHNICAL_EXPOSURE_QUESTIONS',
    'SCENARIO_PREFERENCE_QUESTIONS',
    'WORK_STYLE_QUESTIONS',
    'DIFFICULTY_SELECTION_QUESTIONS',
]
