from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
import json
import re
import subprocess
import tempfile
import uuid


load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="AI Code Review Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000"
],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import re
SUPPORTED_LANGUAGES = [
    "python",
    "javascript",
    "typescript",
    "java",
    "c",
    "cpp",
    "c#",
    "go",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin"
]


def parse_review_response(review_text: str):
    def extract(title):
        pattern = rf"## .*{title}.*\n([\s\S]*?)(?=\n## |\Z)"
        match = re.search(pattern, review_text)
        return f"## {title}\n{match.group(1).strip()}" if match else f"## {title}\n- None"

    return {
        "critical": extract("Critical Issues"),
        "high": extract("High Priority"),
        "medium": extract("Medium Priority"),
        "low": extract("Low Priority"),
    }



class CodeRequest(BaseModel):
    code: str
    language: str

class RewriteRequest(BaseModel):
    code: str
    language: str

class MetricsRequest(BaseModel):
    code: str
    language: str

class ConvertRequest(BaseModel):
    code: str
    source_language: str
    target_language: str

class GenerateRequest(BaseModel):
    prompt: str
    language: str

class CommentRequest(BaseModel):
    code: str
    language: str

class RunRequest(BaseModel):
    code: str
    language: str


def build_generate_prompt(user_prompt: str, language: str):
    return f"""
You are a senior software engineer.

Generate clean, production-ready {language} code.

STRICT RULES:
- Output ONLY raw code
- NO markdown
- NO explanations
- NO commentary
- Ensure complete and correct syntax
- Follow best practices
- Start directly with code.

Task:
{user_prompt}
"""
@app.post("/generate")
def generate_code(request: GenerateRequest):

    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    prompt = build_generate_prompt(request.prompt, request.language)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1500
    )

    result = response.choices[0].message.content.strip()

    # Remove fenced code blocks completely
    result = re.sub(r"^```[a-zA-Z]*\n?", "", result)
    result = re.sub(r"\n?```$", "", result).strip()


    return {
        "generated_code": result
    }

def build_comment_prompt(code: str, language: str):
    return f"""
You are a senior software engineer.

Add clear and helpful comments to this {language} code.

COMMENTING RULES:
- Add a short comment above each function explaining its purpose.
- Add short inline comments for important logic.
- Do NOT add long documentation blocks.
- Do NOT use JavaDoc or multi-line documentation.
- Keep comments concise (1 line each).
- Do NOT over-comment obvious lines.
- Do NOT modify logic.
- Preserve structure exactly.
- Use correct comment syntax for {language}.
- Output ONLY the full commented code.
- No markdown.
- No explanations outside code.

Code:
{code}
"""

@app.post("/comment")
def add_comments(request: CommentRequest):

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    prompt = build_comment_prompt(
        request.code,
        request.language
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1500
    )

    result = response.choices[0].message.content.strip()
    result = result.replace("```", "").strip()

    return {
        "commented_code": result
    }


@app.post("/review")
def review_code(request: CodeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    prompt = f"""
You are a senior {request.language} software engineer and security expert.

IMPORTANT:
- Analyze the code strictly as {request.language}.
- Do NOT assume Python unless explicitly provided.
- Follow {request.language} best practices.
- Detect language-specific vulnerabilities.

Analyze the following code and return the review in EXACTLY this format:

## 🔴 Critical Issues
- List critical bugs, security vulnerabilities, or crashes.

## 🟠 High Priority
- List major performance or logic issues.

## 🟡 Medium Priority
- List maintainability or readability issues.

## 🟢 Low Priority
- List minor improvements or style suggestions.

Language: {request.language}

Code:
{request.code}
"""




    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800
    )

    review_text = response.choices[0].message.content
    structured_review = parse_review_response(review_text)

    return {
        "raw_review": review_text,
        "structured_review": structured_review
    }



@app.post("/rewrite")
def rewrite_code(request: CodeRequest):

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    # =====================================================
    # STEP 1: VALIDATION CALL (PUT IT HERE 👇)
    # =====================================================

    validation_prompt = f"""
You are a strict code validator.

Analyze the following {request.language} code.

Answer ONLY with one word:
VALID
or
INVALID

INVALID means:
- Syntax error
- Runtime error
- Logical error that prevents correct execution

Do NOT explain.

Code:
{request.code}
"""

    validation_response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": validation_prompt}],
        temperature=0,
        max_tokens=10
    )

    status = validation_response.choices[0].message.content.strip()

    # =====================================================
    # STEP 2: IF INVALID → REDIRECT
    # =====================================================

    if status == "INVALID":
        return {
            "rewrite_result": "Code contains logical or runtime errors. Please use the Debug feature."
        }

    # =====================================================
    # STEP 3: NORMAL REWRITE (FORMAT ONLY)
    # =====================================================

    rewrite_prompt = f"""
You are a {request.language} code formatter.

STRICT RULES:
- ONLY improve formatting and readability.
- Fix indentation.
- Improve variable names.
- DO NOT fix logic.
- DO NOT optimize.
- DO NOT add explanations.
- Return ONLY formatted code.
- Do NOT use markdown.

Language: {request.language}

Code:
{request.code}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": rewrite_prompt}],
        temperature=0.2,
        max_tokens=800
    )

    formatted_code = response.choices[0].message.content.strip()

    return {
        "rewrite_result": formatted_code
    }


@app.post("/debug")
def debug_code(request: CodeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")
    
    prompt = f"""
You are a senior {request.language} debugging expert.

IMPORTANT RULES:
- Fix all syntax errors.
- Fix all runtime errors.
- Fix logical bugs.
- Preserve original structure as much as possible.
- DO NOT optimize performance.
- DO NOT redesign architecture.
- DO NOT significantly refactor code.
- Return ONLY corrected code.
- Do NOT use markdown.
- Do NOT wrap in triple backticks.

Language: {request.language}

Code:
{request.code}
"""


    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=900
    )

    fixed_code = response.choices[0].message.content.strip()

    # Safety cleanup if model adds markdown
    fixed_code = fixed_code.replace("```", "").strip()

    return {
        "fixed_code": fixed_code
    }

@app.post("/optimize")
def optimize_code(request: CodeRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    prompt = f"""
You are a senior {request.language} performance optimization engineer.

IMPORTANT:
- Analyze the code strictly as {request.language}.
- Improve time complexity if possible.
- Improve memory efficiency if possible.
- Preserve original functionality.
- Do NOT redesign architecture.
- Do NOT change output behavior.
- Do NOT add explanations inside the code.
- Return ONLY optimized code.
- Do NOT use markdown.
- Do NOT wrap in triple backticks.

Language: {request.language}

Code:
{request.code}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=900
    )

    optimized_code = response.choices[0].message.content.strip()

    # Cleanup markdown if added
    optimized_code = optimized_code.replace("```", "").strip()

    return {
        "optimized_code": optimized_code
    }


@app.post("/convert")
def convert_code(request: ConvertRequest):

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.source_language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported source language")

    if request.target_language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported target language")

    prompt = f"""
You are an expert software engineer fluent in both {request.source_language} and {request.target_language}.

Convert the following code from {request.source_language} to {request.target_language}.

IMPORTANT RULES:
- Preserve functionality exactly.
- Use best practices of {request.target_language}.
- Make it production-ready.
- Do NOT add explanations.
- Do NOT add markdown.
- Do NOT wrap the output in triple backticks.
- Return ONLY pure raw code.
- No headings.
- No labels.
- No formatting text.

Source Language: {request.source_language}
Target Language: {request.target_language}

Code:
{request.code}
"""


    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000
    )

    return {
        "conversion_result": response.choices[0].message.content
    }


def generate_quality_metrics(code: str, language: str):

    prompt = f"""
Analyze the following {language} code.

Return ONLY raw JSON.
Do NOT wrap in markdown.
No explanations.

Format:

{{
  "security_risk": "Low | Medium | High",
  "readability_score": number,
  "maintainability_score": number,
  "code_smells": number
}}

Code:
{code}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=200
    )

    raw = response.choices[0].message.content.strip()

    # Remove markdown if model still adds it
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "security_risk": "Unknown",
            "readability_score": 0,
            "maintainability_score": 0,
            "code_smells": 0
        }

@app.post("/run")
def run_code(request: RunRequest):

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    language = request.language.lower()

    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    try:
        # Create temporary file
        file_id = str(uuid.uuid4())

        if language == "python":
            file_path = f"{file_id}.py"
            command = ["python", file_path]

        elif language == "javascript":
            file_path = f"{file_id}.js"
            command = ["node", file_path]

        elif language == "java":
            file_path = f"{file_id}.java"
            class_name = "Main"
            request.code = request.code.replace("public class", f"public class {class_name}")
            command = ["javac", file_path]

        elif language == "c":
            file_path = f"{file_id}.c"
            exe_path = f"{file_id}.out"
            command = ["gcc", file_path, "-o", exe_path]

        elif language == "cpp":
            file_path = f"{file_id}.cpp"
            exe_path = f"{file_id}.out"
            command = ["g++", file_path, "-o", exe_path]

        else:
            raise HTTPException(status_code=400, detail="Execution not supported for this language yet")

        # Write code to file
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(request.code)

        # Compile if needed
        if language in ["c", "cpp"]:
            compile_process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=10
            )

            if compile_process.returncode != 0:
                return {
                    "output": "",
                    "error": compile_process.stderr
                }

            run_process = subprocess.run(
                [f"./{exe_path}"],
                capture_output=True,
                text=True,
                timeout=10
            )

        elif language == "java":
            compile_process = subprocess.run(
                ["javac", file_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            if compile_process.returncode != 0:
                return {
                    "output": "",
                    "error": compile_process.stderr
                }

            run_process = subprocess.run(
                ["java", class_name],
                capture_output=True,
                text=True,
                timeout=10
            )

        else:
            run_process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=10
            )

        return {
            "output": run_process.stdout,
            "error": run_process.stderr
        }

    except subprocess.TimeoutExpired:
        return {
            "output": "",
            "error": "Execution timed out."
        }

    except Exception as e:
        return {
            "output": "",
            "error": str(e)
        }


@app.post("/metrics")
def code_metrics(request: MetricsRequest):

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")


    return generate_quality_metrics(
        request.code,
        request.language
    )