import json
import logging
from typing import Dict, List, Optional

from google import genai
from google.genai import types

from app.core.config import settings
from app.models.schemas import (
    ProficiencyLevel,
    SkillPriority,
    TopicRoadmap,
    Chapter,
    Unit,
    Resource,
    RecommendedProject,
    InterviewQuestion,
)

logger = logging.getLogger(__name__)


# ============================================================
# GEMINI CLIENT
# ============================================================

def get_client() -> Optional[genai.Client]:
    """
    Create and return the Gemini client.
    Returns None if the API key is unavailable or initialization fails.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("Gemini API key is not configured.")
        return None

    try:
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")
        return None


# ============================================================
# MOCK DATA
# ============================================================

MOCK_CANDIDATE_SKILLS: Dict[str, ProficiencyLevel] = {
    "Python": "Intermediate",
    "JavaScript": "Advanced",
    "HTML/CSS": "Advanced",
    "Git": "Intermediate",
    "SQL": "Beginner",
}


MOCK_REQUIRED_SKILLS: Dict[str, SkillPriority] = {
    "Python": "must-have",
    "FastAPI": "must-have",
    "Docker": "must-have",
    "React": "nice-to-have",
    "PostgreSQL": "must-have",
    "Git": "nice-to-have",
}


# ============================================================
# RESUME SKILL PARSING
# ============================================================

def parse_resume_skills(
    resume_text: str,
) -> Dict[str, ProficiencyLevel]:

    client = get_client()

    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock parse_resume_skills")
        return MOCK_CANDIDATE_SKILLS

    prompt = f"""
Analyze the following resume and extract the candidate's technical skills.

Allowed proficiency levels:
"Beginner", "Intermediate", "Advanced", "Expert".

Return ONLY valid JSON.

Example:
{{
    "Python": "Intermediate",
    "React": "Advanced",
    "SQL": "Beginner"
}}

Resume:
{resume_text}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        data = json.loads(response.text)

        if isinstance(data, dict):
            return data

        return MOCK_CANDIDATE_SKILLS

    except Exception as e:
        logger.error(f"Gemini resume parsing failed: {e}")
        return MOCK_CANDIDATE_SKILLS


# ============================================================
# JOB DESCRIPTION SKILL PARSING
# ============================================================

def parse_job_description_skills(
    job_desc: str,
) -> Dict[str, SkillPriority]:

    client = get_client()

    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock parse_job_description_skills")
        return MOCK_REQUIRED_SKILLS

    prompt = f"""
Analyze the following job description.

Extract the important technical skills and classify each as:

"must-have"
or
"nice-to-have"

Return ONLY valid JSON.

Example:
{{
    "Python": "must-have",
    "Docker": "must-have",
    "AWS": "nice-to-have"
}}

Job Description:
{job_desc}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        data = json.loads(response.text)

        if isinstance(data, dict):
            return data

        return MOCK_REQUIRED_SKILLS

    except Exception as e:
        logger.error(
            f"Gemini job description parsing failed: {e}"
        )
        return MOCK_REQUIRED_SKILLS


# ============================================================
# ROADMAP GENERATION
# ============================================================

def generate_roadmap(
    missing_skills: List[str],
) -> List[TopicRoadmap]:

    if not missing_skills:
        return []

    client = get_client()

    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock generate_roadmap")
        return _mock_roadmap(missing_skills)

    prompt = f"""
Create a structured learning roadmap for these missing skills:

{json.dumps(missing_skills)}

For every missing skill generate exactly 4 chapters:

1. Foundations
2. Core Concepts
3. Applied Practice
4. Mastery

Each chapter should contain 2 to 3 units.

Each unit should contain 2 to 3 learning resources.

Each resource must contain:

- title
- url
- type
- source
- est_minutes
- verified

Allowed resource types:

"video"
"article"
"documentation"

If you are not certain that a URL exists, provide a clean
canonical documentation/tutorial/search URL and set:

"verified": false

Return ONLY valid JSON matching this structure:

[
  {{
    "topic_id": "python",
    "topic_name": "Python",
    "weakness_level": "High Priority",
    "chapters": [
      {{
        "chapter_number": 1,
        "chapter_title": "Foundations",
        "description": "Introduction to Python fundamentals.",
        "units": [
          {{
            "unit_id": "python-c1-u1",
            "unit_title": "Python Basics",
            "summary": "Learn Python syntax and basic programming concepts.",
            "resources": [
              {{
                "title": "Python Documentation",
                "url": "https://docs.python.org/3/",
                "type": "documentation",
                "source": "Python",
                "est_minutes": 20,
                "verified": true
              }}
            ]
          }}
        ]
      }}
    ]
  }}
]
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        raw_list = json.loads(response.text)

        return [
            TopicRoadmap(**item)
            for item in raw_list
        ]

    except Exception as e:
        logger.error(
            f"Gemini roadmap generation failed: {e}"
        )

        return _mock_roadmap(missing_skills)


# ============================================================
# PROJECT GENERATION
# ============================================================

def generate_projects(
    missing_skills: List[str],
) -> List[RecommendedProject]:

    if not missing_skills:
        return []

    client = get_client()

    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock generate_projects")
        return _mock_projects(missing_skills)

    prompt = f"""
For each missing skill below, generate 2 practical portfolio
projects suitable for a student.

Missing skills:

{json.dumps(missing_skills)}

Return ONLY valid JSON.

Format:

[
  {{
    "project_id": "proj-1",
    "skill": "Docker",
    "title": "Containerized API",
    "description": "Build a practical Docker project.",
    "difficulty": "Intermediate"
  }}
]

Allowed difficulties:

"Beginner"
"Intermediate"
"Advanced"
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        raw_list = json.loads(response.text)

        return [
            RecommendedProject(**item)
            for item in raw_list
        ]

    except Exception as e:
        logger.error(
            f"Gemini project generation failed: {e}"
        )

        return _mock_projects(missing_skills)


# ============================================================
# INTERVIEW PREPARATION
# ============================================================

def generate_interview_prep(
    role_title: str,
    candidate_skills: List[str],
    missing_skills: List[str],
) -> List[InterviewQuestion]:

    client = get_client()

    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock generate_interview_prep")
        return _mock_interview_prep(role_title)

    prompt = f"""
Generate interview preparation for the following role:

Role:
{role_title}

Candidate skills:
{json.dumps(candidate_skills)}

Missing skills:
{json.dumps(missing_skills)}

Generate:

- 6 technical questions
- 2 behavioral/HR questions

Provide useful model answers.

Return ONLY valid JSON.

Example:

[
  {{
    "q_id": "q-1",
    "question": "Explain how FastAPI handles asynchronous requests.",
    "category": "Technical",
    "model_answer": "FastAPI uses Python async..."
  }}
]

Allowed categories:

"Technical"
"HR"
"Behavioral"
"System Design"
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        raw_list = json.loads(response.text)

        return [
            InterviewQuestion(**item)
            for item in raw_list
        ]

    except Exception as e:
        logger.error(
            f"Gemini interview preparation failed: {e}"
        )

        return _mock_interview_prep(role_title)


# ============================================================
# CHATBOT / SKILL GAP ASSISTANT
# ============================================================

def generate_chat_response(
    message: str,
    target_role: Optional[str] = None,
    candidate_skills: Optional[List[str]] = None,
    missing_skills: Optional[List[str]] = None,
    readiness_score: Optional[float] = None,
) -> str:
    """
    Generate a question-aware personalized Skill Gap Assistant response.

    The chatbot uses the user's real SkillGapAnalyzer data:

    - target role
    - current skills
    - missing skills
    - readiness score

    The response changes depending on what the user asks.
    """

    client = get_client()

    candidate_skills = candidate_skills or []
    missing_skills = missing_skills or []

    # ========================================================
    # FALLBACK MODE
    # ========================================================

    if not client or settings.USE_MOCK_DATA:

        logger.info(
            "Using fallback Skill Gap Assistant response"
        )

        question = message.lower()

        # ----------------------------------------------------
        # BIGGEST SKILL GAPS
        # ----------------------------------------------------

        if (
            "biggest skill gap" in question
            or "biggest gaps" in question
            or "main skill gap" in question
            or "main gaps" in question
            or "skill gaps" in question
            or "skill gap" in question
            or "what are my gaps" in question
        ):

            if missing_skills:

                return (
                    "Your main skill gaps are:\n\n"
                    + "\n".join(
                        f"• {skill}"
                        for skill in missing_skills
                    )
                    + "\n\n"
                    "These are the skills identified as "
                    "missing or weaker for your target role."
                )

            return (
                "Your analysis did not identify any major "
                "missing skills."
            )

        # ----------------------------------------------------
        # WHAT TO LEARN FIRST
        # ----------------------------------------------------

        if (
            "learn first" in question
            or "start with" in question
            or "where should i start" in question
            or "what should i learn" in question
            or "prioritize" in question
            or "what next" in question
        ):

            if missing_skills:

                first_skill = missing_skills[0]
                remaining = missing_skills[1:4]

                response = (
                    f"I would start with **{first_skill}** "
                    f"because it is one of the skills identified "
                    f"as missing for your target role."
                )

                if remaining:

                    response += (
                        "\n\nSuggested next skills:\n"
                        + "\n".join(
                            f"• {skill}"
                            for skill in remaining
                        )
                    )

                return response

            return (
                "Your analysis does not currently show any "
                "missing skills to prioritize."
            )

        # ----------------------------------------------------
        # READINESS
        # ----------------------------------------------------

        if (
            "readiness" in question
            or "score" in question
            or "why am i" in question
        ):

            if readiness_score is not None:

                if missing_skills:

                    return (
                        f"Your current readiness score is "
                        f"**{readiness_score:.0f}%**.\n\n"
                        "The analysis identified these missing "
                        "or weaker areas:\n"
                        + "\n".join(
                            f"• {skill}"
                            for skill in missing_skills
                        )
                        + "\n\n"
                        "Improving these areas should help "
                        "address the gaps identified by your "
                        "analysis."
                    )

                return (
                    f"Your current readiness score is "
                    f"**{readiness_score:.0f}%**."
                )

        # ----------------------------------------------------
        # SPECIFIC SKILL QUESTIONS
        # ----------------------------------------------------

        question_words = question.replace("?", " ").split()

        for skill in candidate_skills:

            skill_lower = skill.lower()

            if (
                skill_lower in question
                or any(
                    word == skill_lower
                    for word in question_words
                )
            ):

                return (
                    f"You already have **{skill}** listed "
                    f"in your current skills.\n\n"
                    f"To strengthen {skill}, focus on "
                    f"hands-on projects, real-world problems, "
                    f"debugging, and interview-style practice."
                )

        for skill in missing_skills:

            skill_lower = skill.lower()

            if skill_lower in question:

                return (
                    f"**{skill}** is one of the missing skills "
                    f"identified in your analysis.\n\n"
                    f"I recommend learning its fundamentals "
                    f"first, then building a small practical "
                    f"project to reinforce it."
                )

        # ----------------------------------------------------
        # UNKNOWN SKILL
        # ----------------------------------------------------

        known_skills = [
            skill.lower()
            for skill in candidate_skills + missing_skills
        ]

        common_external_skills = [
            "react",
            "angular",
            "vue",
            "java",
            "c++",
            "c#",
            "go",
            "golang",
            "rust",
            "typescript",
            "kotlin",
            "swift",
        ]

        for skill in common_external_skills:

            if skill in question and skill not in known_skills:

                return (
                    f"**{skill.title()}** is not included "
                    f"in your current SkillGapAnalyzer analysis, "
                    f"so I can't determine your level from the "
                    f"available data."
                )

        # ----------------------------------------------------
        # LEARNING PLAN / ROADMAP
        # ----------------------------------------------------

        if (
            "roadmap" in question
            or "study plan" in question
            or "30-day" in question
            or "30 day" in question
            or "learning plan" in question
            or "plan" in question
        ):

            if missing_skills:

                return (
                    "A practical learning order would be:\n\n"
                    + "\n".join(
                        f"{index + 1}. {skill}"
                        for index, skill
                        in enumerate(missing_skills)
                    )
                    + "\n\n"
                    "For each skill, learn the fundamentals, "
                    "practice with a small project, and then "
                    "move to the next skill."
                )

        # ----------------------------------------------------
        # INTERVIEW
        # ----------------------------------------------------

        if (
            "interview" in question
            or "interview questions" in question
        ):

            return (
                f"For the **{target_role or 'target role'}** "
                f"role, focus your interview preparation on "
                f"your current skills and identified gaps.\n\n"
                f"Important areas to prepare include: "
                f"{', '.join(missing_skills[:5]) if missing_skills else 'your core technical skills'}."
            )

        # ----------------------------------------------------
        # GENERIC FALLBACK
        # ----------------------------------------------------

        return (
            f"For your **{target_role or 'target role'}** "
            f"analysis, your current skills include "
            f"{', '.join(candidate_skills[:5]) if candidate_skills else 'the skills in your analysis'}.\n\n"
            f"You can ask me about your biggest gaps, "
            f"what to learn first, your readiness score, "
            f"a learning roadmap, or interview preparation."
        )

    # ========================================================
    # DETERMINE QUESTION INTENT
    # ========================================================

    question = message.lower().strip()

    if (
        "biggest skill gap" in question
        or "biggest gaps" in question
        or "main skill gap" in question
        or "main gaps" in question
        or "skill gaps" in question
        or "what are my gaps" in question
        or "weakest skills" in question
        or "weakest areas" in question
    ):

        intent = "BIGGEST_GAPS"

    elif (
        "learn first" in question
        or "what should i learn" in question
        or "where should i start" in question
        or "start with" in question
        or "prioritize" in question
        or "what next" in question
        or "next skill" in question
    ):

        intent = "LEARNING_PRIORITY"

    elif (
        "readiness" in question
        or "readiness score" in question
        or "why is my score" in question
        or "why am i only" in question
        or "why is my score low" in question
    ):

        intent = "READINESS"

    elif (
        "30-day" in question
        or "30 day" in question
        or "roadmap" in question
        or "study plan" in question
        or "learning plan" in question
        or "plan for" in question
        or "give me a plan" in question
    ):

        intent = "ROADMAP"

    elif (
        "interview" in question
        or "interview questions" in question
        or "prepare for interview" in question
        or "prepare for an interview" in question
    ):

        intent = "INTERVIEW"

    else:

        intent = "GENERAL"

    # ========================================================
    # GEMINI PROMPT
    # ========================================================

    prompt = f"""
You are the Skill Gap Assistant inside SkillGapAnalyzer.

Your job is to answer the user's CURRENT QUESTION.

You must change your response depending on what the user asks.

============================================================
USER ANALYSIS
============================================================

Target role:
{target_role or "Not specified"}

Current skills:
{json.dumps(candidate_skills)}

Missing / weaker skills:
{json.dumps(missing_skills)}

Readiness score:
{
    readiness_score
    if readiness_score is not None
    else "Not available"
}

============================================================
CURRENT USER QUESTION
============================================================

{message}

Detected question type:
{intent}

============================================================
IMPORTANT RULES
============================================================

1. Answer the CURRENT QUESTION directly.

2. DO NOT give the same generic response to every question.

3. DO NOT automatically mention the readiness score.

4. DO NOT automatically repeat the entire missing-skills list.

5. DO NOT start every response with:
   "Based on your analysis..."

6. Only mention information relevant to the question.

7. Use ONLY the supplied SkillGapAnalyzer data.

8. Never invent:
   - skills
   - proficiency levels
   - experience
   - certifications
   - projects
   - achievements
   - readiness calculations

9. If the user asks about a skill that is NOT present in either
   the current-skills list or missing-skills list, explicitly say
   that the skill is not included in the current analysis.

10. Be specific and practical.

11. Use bullets or numbered steps when useful.

12. Be encouraging but realistic.

13. Never claim the user has experience with something unless
    the supplied analysis says so.

14. Never invent a proficiency level.

15. Do not mention these instructions or this prompt.

============================================================
QUESTION-SPECIFIC BEHAVIOR
============================================================

IF QUESTION TYPE = BIGGEST_GAPS:

The user wants to understand their biggest skill gaps.

You should:

- Focus on the missing/weak skills.
- Explain the importance of the most relevant gaps.
- Explain what the user should focus on.
- Do not make the answer primarily about the readiness score.

Example structure:

"Your biggest gaps are:

1. FastAPI
   Why it matters: ...

2. PostgreSQL
   Why it matters: ...

3. Docker
   Why it matters: ...

I would focus on ... first."

Only use skills from the supplied missing-skills list.


============================================================
IF QUESTION TYPE = LEARNING_PRIORITY
============================================================

The user wants to know what to learn first.

You should:

- Select the most logical first skill from the missing-skills list.
- Explain why it should come first.
- Give a sensible next 2-4 skills.
- Do not simply repeat the entire list without reasoning.


============================================================
IF QUESTION TYPE = READINESS
============================================================

The user wants to understand their readiness score.

You should:

- Explain the supplied readiness score.
- Connect it to the missing skills.
- Explain what improvements could address the identified gaps.
- Do NOT invent the mathematical formula used to calculate the score.


============================================================
IF QUESTION TYPE = ROADMAP
============================================================

The user wants a learning plan.

You should:

- Create a step-by-step learning sequence.
- Start with foundational skills.
- Move toward more advanced skills.
- Include practical exercises or projects.
- If the user requests a specific duration, divide the plan
  across that duration.


============================================================
IF QUESTION TYPE = INTERVIEW
============================================================

The user wants interview preparation.

You should:

- Focus on the target role.
- Use the user's current and missing skills.
- Give relevant interview topics or questions.
- Include practical preparation advice.


============================================================
IF QUESTION TYPE = GENERAL
============================================================

Answer exactly what the user asks.

If the user asks about a specific skill:

If it exists in CURRENT SKILLS:
- Explain how to improve it.
- Suggest practical ways to strengthen it.

If it exists in MISSING SKILLS:
- Explain how to learn it.
- Explain why it matters for the target role.

If it exists in neither:
- Say that the skill is not included in the current
  SkillGapAnalyzer analysis.
- Do not guess the user's proficiency.


============================================================
EXAMPLES OF REQUIRED BEHAVIOR
============================================================

Question:
"What are my biggest skill gaps?"

Answer should:
- Focus on missing skills.
- Explain the most important gaps.

Question:
"What should I learn first?"

Answer should:
- Recommend a first skill.
- Explain why.
- Give the next suggested skills.

Question:
"Why is my readiness only 27%?"

Answer should:
- Explain the supplied 27% score.
- Connect it to the identified gaps.

Question:
"Give me a 30-day plan."

Answer should:
- Create a practical 30-day learning plan.

Question:
"How can I improve FastAPI?"

Answer should:
- Focus specifically on FastAPI.

Question:
"What is my React skill level?"

If React is not in the supplied analysis:
- Say that React is not included in the current analysis.
- Do NOT invent a React proficiency level.

============================================================
FINAL REQUIREMENT
============================================================

Different questions MUST produce different answers.

Do not use one generic response for all questions.

Return ONLY the answer to the user.
"""

    # ========================================================
    # CALL GEMINI
    # ========================================================

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        if response and response.text:

            return response.text.strip()

        return (
            "I couldn't generate a response right now. "
            "Please try again."
        )

    except Exception as e:

        logger.error(
            f"Gemini chatbot response failed: {e}"
        )

        # ====================================================
        # QUESTION-AWARE ERROR FALLBACK
        # ====================================================

        if intent == "BIGGEST_GAPS":

            if missing_skills:

                return (
                    "Your biggest identified skill gaps are:\n\n"
                    + "\n".join(
                        f"• {skill}"
                        for skill in missing_skills
                    )
                )

            return (
                "Your analysis did not identify any missing skills."
            )

        if intent == "LEARNING_PRIORITY":

            if missing_skills:

                first_skill = missing_skills[0]

                remaining = missing_skills[1:]

                response = (
                    f"I would start with **{first_skill}** "
                    f"based on your current analysis."
                )

                if remaining:

                    response += (
                        "\n\nThen move to:\n"
                        + "\n".join(
                            f"• {skill}"
                            for skill in remaining
                        )
                    )

                return response

            return (
                "There are no missing skills available in "
                "your current analysis to prioritize."
            )

        if intent == "READINESS":

            if readiness_score is not None:

                return (
                    f"Your current readiness score is "
                    f"**{readiness_score:.0f}%**.\n\n"
                    f"The analysis identifies these missing "
                    f"skills:\n"
                    + "\n".join(
                        f"• {skill}"
                        for skill in missing_skills
                    )
                    + "\n\n"
                    "Improving these areas should address "
                    "the gaps identified by your analysis."
                )

        if intent == "ROADMAP":

            if missing_skills:

                return (
                    "Your learning sequence should be:\n\n"
                    + "\n".join(
                        f"{index + 1}. {skill}"
                        for index, skill
                        in enumerate(missing_skills)
                    )
                )

        if intent == "INTERVIEW":

            return (
                f"For the **{target_role or 'target role'}** "
                f"role, prepare around your current skills "
                f"and identified gaps.\n\n"
                f"Important areas include: "
                f"{', '.join(missing_skills[:5]) if missing_skills else 'your core technical skills'}."
            )

        return (
            "I'm having trouble connecting to the AI service "
            "right now. Please try again in a moment."
        )


# ============================================================
# MOCK ROADMAP
# ============================================================

def _mock_roadmap(
    missing_skills: List[str],
) -> List[TopicRoadmap]:

    result = []

    for skill in missing_skills:

        slug = (
            skill.lower()
            .replace(" ", "-")
            .replace("/", "-")
        )

        chapters = [

            # ------------------------------------------------
            # CHAPTER 1
            # ------------------------------------------------

            Chapter(
                chapter_number=1,
                chapter_title="Foundations",
                description=(
                    f"Core introduction to "
                    f"{skill} fundamentals."
                ),
                units=[
                    Unit(
                        unit_id=f"{slug}-1-1",
                        unit_title=(
                            f"Introduction to {skill}"
                        ),
                        summary=(
                            f"Understand the basic concepts "
                            f"and setup of {skill}."
                        ),
                        resources=[
                            Resource(
                                title=(
                                    f"{skill} Crash Course "
                                    f"for Beginners"
                                ),
                                url=(
                                    "https://www.youtube.com/"
                                    "results?search_query="
                                    f"{skill}+crash+course"
                                ),
                                type="video",
                                source="YouTube",
                                est_minutes=25,
                                verified=False,
                            ),
                            Resource(
                                title=(
                                    f"Official {skill} "
                                    f"Documentation"
                                ),
                                url=(
                                    "https://www.google.com/"
                                    "search?q="
                                    f"{skill}+official+documentation"
                                ),
                                type="documentation",
                                source="Official Docs",
                                est_minutes=15,
                                verified=False,
                            ),
                        ],
                    )
                ],
            ),

            # ------------------------------------------------
            # CHAPTER 2
            # ------------------------------------------------

            Chapter(
                chapter_number=2,
                chapter_title="Core Concepts",
                description=(
                    f"Learn the core concepts and "
                    f"important patterns of {skill}."
                ),
                units=[
                    Unit(
                        unit_id=f"{slug}-2-1",
                        unit_title=(
                            f"Core Concepts in {skill}"
                        ),
                        summary=(
                            f"Learn essential concepts "
                            f"and patterns used with {skill}."
                        ),
                        resources=[
                            Resource(
                                title=(
                                    f"Mastering {skill} "
                                    f"Core Concepts"
                                ),
                                url=(
                                    "https://dev.to/search?q="
                                    f"{skill}"
                                ),
                                type="article",
                                source="Dev.to",
                                est_minutes=20,
                                verified=False,
                            )
                        ],
                    )
                ],
            ),

            # ------------------------------------------------
            # CHAPTER 3
            # ------------------------------------------------

            Chapter(
                chapter_number=3,
                chapter_title="Applied Practice",
                description=(
                    f"Apply {skill} through hands-on "
                    f"practice and projects."
                ),
                units=[
                    Unit(
                        unit_id=f"{slug}-3-1",
                        unit_title=(
                            f"Build a Small {skill} Project"
                        ),
                        summary=(
                            f"Build a practical project "
                            f"using {skill}."
                        ),
                        resources=[
                            Resource(
                                title=(
                                    f"Practical {skill} Tutorial"
                                ),
                                url=(
                                    "https://medium.com/search?q="
                                    f"{skill}+tutorial"
                                ),
                                type="article",
                                source="Medium",
                                est_minutes=45,
                                verified=False,
                            )
                        ],
                    )
                ],
            ),

            # ------------------------------------------------
            # CHAPTER 4
            # ------------------------------------------------

            Chapter(
                chapter_number=4,
                chapter_title="Mastery",
                description=(
                    f"Explore advanced topics, "
                    f"optimization and production "
                    f"best practices for {skill}."
                ),
                units=[
                    Unit(
                        unit_id=f"{slug}-4-1",
                        unit_title=(
                            f"Advanced {skill}"
                        ),
                        summary=(
                            f"Learn production-level "
                            f"best practices for {skill}."
                        ),
                        resources=[
                            Resource(
                                title=(
                                    f"Production-Grade "
                                    f"{skill} Guide"
                                ),
                                url=(
                                    "https://github.com/search?q="
                                    f"{skill}+awesome"
                                ),
                                type="article",
                                source="GitHub",
                                est_minutes=30,
                                verified=False,
                            )
                        ],
                    )
                ],
            ),
        ]

        result.append(
            TopicRoadmap(
                topic_id=slug,
                topic_name=skill,
                weakness_level="High Priority",
                chapters=chapters,
            )
        )

    return result


# ============================================================
# MOCK PROJECTS
# ============================================================

def _mock_projects(
    missing_skills: List[str],
) -> List[RecommendedProject]:

    projects = []

    for idx, skill in enumerate(missing_skills):

        projects.append(
            RecommendedProject(
                project_id=f"proj-{idx * 2 + 1}",
                skill=skill,
                title=(
                    f"Hands-on {skill} Dashboard"
                ),
                description=(
                    f"Build an interactive application "
                    f"that integrates {skill} into a "
                    f"real-world workflow."
                ),
                difficulty="Intermediate",
            )
        )

        projects.append(
            RecommendedProject(
                project_id=f"proj-{idx * 2 + 2}",
                skill=skill,
                title=(
                    f"{skill} Microservice Starter"
                ),
                description=(
                    f"Develop a practical API or automated "
                    f"script demonstrating effective use "
                    f"of {skill}."
                ),
                difficulty="Advanced",
            )
        )

    return projects


# ============================================================
# MOCK INTERVIEW PREPARATION
# ============================================================

def _mock_interview_prep(
    role_title: str,
) -> List[InterviewQuestion]:

    return [

        InterviewQuestion(
            q_id="q-1",
            question=(
                f"What are the key architectural principles "
                f"you follow when building for a "
                f"{role_title} role?"
            ),
            category="Technical",
            model_answer=(
                "Focus on modularity, separation of concerns, "
                "defensive programming, error handling, "
                "logging, testing, and maintainable code."
            ),
        ),

        InterviewQuestion(
            q_id="q-2",
            question=(
                "Describe a challenging technical obstacle "
                "you faced and how you debugged it."
            ),
            category="Behavioral",
            model_answer=(
                "Use the STAR method: Situation, Task, "
                "Action, and Result. Explain the problem, "
                "what you investigated, the solution you "
                "implemented, and the measurable result."
            ),
        ),

        InterviewQuestion(
            q_id="q-3",
            question=(
                "How do you handle trade-offs between "
                "speed of delivery and code quality?"
            ),
            category="HR",
            model_answer=(
                "Prioritize core functionality while keeping "
                "interfaces clean, documenting technical debt, "
                "and planning iterative refactoring."
            ),
        ),

        InterviewQuestion(
            q_id="q-4",
            question=(
                "Explain the difference between synchronous "
                "and asynchronous processing in backend services."
            ),
            category="Technical",
            model_answer=(
                "Synchronous execution waits for an operation "
                "to finish before continuing. Asynchronous "
                "execution allows other work to continue while "
                "waiting for I/O operations."
            ),
        ),

        InterviewQuestion(
            q_id="q-5",
            question=(
                "How would you design a scalable web "
                "application with high traffic?"
            ),
            category="System Design",
            model_answer=(
                "Use horizontal scaling, load balancing, "
                "caching, database indexing, efficient APIs, "
                "monitoring, and asynchronous workers where "
                "appropriate."
            ),
        ),

        InterviewQuestion(
            q_id="q-6",
            question=(
                "How do you make sure your code remains "
                "maintainable as a project grows?"
            ),
            category="Technical",
            model_answer=(
                "Use clear module boundaries, meaningful names, "
                "automated tests, documentation, code reviews, "
                "consistent formatting, and avoid unnecessary "
                "duplication."
            ),
        ),
    ]