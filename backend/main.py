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
from pydantic import BaseModel
from firebase_config import db
from datetime import datetime
import requests

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
    "kotlin",
    "sql"
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

class WorkspaceCreate(BaseModel):
    user_id: str
    name: str
    repo_url: str

class WorkspaceReviewRequest(BaseModel):
    user_id: str
    workspace_id: str
    code: str
    language: str

class DocumentationRequest(BaseModel):
    user_id: str
    workspace_id: str
    doc_type: str

class ExplainProjectRequest(BaseModel):
    user_id: str
    workspace_id: str

class EdgeCaseRequest(BaseModel):
    code: str
    language: str

class GenerateRequest(BaseModel):
    message: str
    language: str
    history: list = []

@app.post("/workspace/explain")
def explain_workspace(request: ExplainProjectRequest):

    workspace_ref = db.collection("users") \
        .document(request.user_id) \
        .collection("workspaces") \
        .document(request.workspace_id)

    workspace_doc = workspace_ref.get()

    if not workspace_doc.exists:
        raise HTTPException(status_code=404, detail="Workspace not found")

    workspace_data = workspace_doc.to_dict()

    files_ref = workspace_ref.collection("files").stream()
    files = [file.to_dict() for file in files_ref]

    prompt = build_project_explanation_prompt(
        files,
        workspace_data.get("tech_stack", [])
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1200
    )

    explanation = response.choices[0].message.content.strip()

    return {
        "explanation": explanation
    }

def build_project_explanation_prompt(files, tech_stack):

    file_list = "\n".join([f"- {file.get('file_name', file.get('name'))}" for file in files])

    return f"""
You are a senior software architect.

Tech Stack:
{tech_stack}

Project Files:
{file_list}

Explain clearly:
- What this project does
- How the architecture works
- Backend / Frontend interaction
- Major components

Be structured and detailed.
"""


def fetch_repo_files(repo_url):
    parts = repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1]

    all_files = []

    def fetch_directory(path=""):
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        response = requests.get(api_url)

        if response.status_code != 200:
            print("GitHub API Error:", response.status_code, response.text)
            raise HTTPException(
                status_code=400,
                detail=f"GitHub API failed: {response.status_code}"
            )

        items = response.json()

        for item in items:
            if item["type"] == "file":
                all_files.append({
                    "name": item["name"],
                    "path": item["path"],
                    "download_url": item["download_url"],
                    "type": "file"
                })
            elif item["type"] == "dir":
                fetch_directory(item["path"])

    fetch_directory()
    return all_files

def generate_project_summary(tech_stack, files):

    prompt = f"""
    Tech Stack: {tech_stack}
    Files: {[file['name'] for file in files]}

    Explain in 4-5 lines what this project likely does.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content

@app.get("/workspace/{user_id}/{workspace_id}/files")
def get_workspace_files(user_id: str, workspace_id: str):

    files_ref = db.collection("users") \
                  .document(user_id) \
                  .collection("workspaces") \
                  .document(workspace_id) \
                  .collection("files") \
                  .stream()

    result = []

    for file in files_ref:
        data = file.to_dict()
        data["id"] = file.id
        result.append(data)

    return result

@app.get("/workspace/file-content")
def get_file_content(download_url: str):

    try:
        response = requests.get(download_url)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch file")

        return {
            "content": response.text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    prompt = f"""
You are a senior {request.language} software engineer.

If this is the first message, generate COMPLETE production-ready code.

If the user provides an instruction, modify the EXISTING code accordingly.

Return ONLY raw full code.
No markdown.
No explanations.

Current Code:
{request.history[-1]['content'] if request.history else ""}

User Instruction:
{request.message}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=1500
    )

    result = response.choices[0].message.content.strip()
    result = result.replace("```", "").strip()

    return {
        "code": result
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
- Check for syntax errors.
- Check for runtime errors.
- Check for logical bugs.
- If the code has ANY issue:
    1. First clearly list the errors found.
    2. Then provide the corrected code.
- If the code has NO issues at all, respond EXACTLY with:
Your code is correct, no bugs found.
- DO NOT optimize performance.
- DO NOT redesign architecture.
- DO NOT significantly refactor code.
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

    result = response.choices[0].message.content.strip()
    result = result.replace("```", "").strip()

    if result.lower() == "your code is correct, no bugs found.":
        return {
            "message": "Your code is correct, no bugs found."
        }

    # Split errors and fixed code
    if "Corrected Code:" in result:
        parts = result.split("Corrected Code:")
        errors = parts[0].strip()
        fixed_code = parts[1].strip()

        return {
            "errors": errors,
            "fixed_code": fixed_code
        }

    return {
        "fixed_code": result
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
- Improve time complexity if possible.
- Improve space complexity if possible.
- Preserve functionality.
- Do NOT add markdown.
- Return ONLY raw JSON.

FORMAT:

{{
  "optimized_code": "...",
  "theoretical_explanation": "...",
  "before_time_complexity": "...",
  "before_space_complexity": "...",
  "after_time_complexity": "...",
  "after_space_complexity": "..."
}}

Code:
{request.code}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1200
    )

    raw = response.choices[0].message.content.strip()

    # Clean markdown if model adds it
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except Exception:
        # Fallback if model fails formatting
        return {
            "optimized_code": raw,
            "theoretical_explanation": "Explanation not generated.",
            "before_time_complexity": "Unknown",
            "before_space_complexity": "Unknown",
            "after_time_complexity": "Unknown",
            "after_space_complexity": "Unknown"
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
        print("LANGUAGE RECEIVED:", request.language)
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
        elif language == "sql":
            import sqlite3

            try:
                conn = sqlite3.connect(":memory:")
                cursor = conn.cursor()

                # Execute full script (handles multiple statements)
                cursor.executescript(request.code)

                # Get last statement
                statements = [s.strip() for s in request.code.strip().split(";") if s.strip()]
                last_statement = statements[-1].lower()

                # If last statement is SELECT, fetch results
                if last_statement.startswith("select"):
                    cursor.execute(statements[-1])
                    rows = cursor.fetchall()
                    conn.close()
                    return {
                        "output": str(rows),
                        "error": ""
                    }

                conn.commit()
                conn.close()

                return {
                    "output": "query executed successfully.",
                    "error": ""
                }

            except Exception as e:
                return {
                    "output": "",
                    "error": str(e)
                }



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

def detect_tech_stack(files):
    tech_stack = []
    file_names = [file["name"] for file in files]

    extensions = set()
    for file in file_names:
        if "." in file:
            extensions.add(file.split(".")[-1].lower())

    # Backend frameworks
    if "requirements.txt" in file_names:
        tech_stack.append("Python")

    if "pom.xml" in file_names:
        tech_stack.append("Java")

    # Node ecosystem
    if "package.json" in file_names:
        tech_stack.append("Node.js")

    # Frontend detection by extension
    if "html" in extensions:
        tech_stack.append("HTML")

    if "css" in extensions:
        tech_stack.append("CSS")

    if "js" in extensions:
        tech_stack.append("JavaScript")

    if "jsx" in extensions:
        tech_stack.append("React")

    if "ts" in extensions or "tsx" in extensions:
        tech_stack.append("TypeScript")

    if "php" in extensions:
        tech_stack.append("PHP")

    if "py" in extensions:
        tech_stack.append("Python")

    return list(set(tech_stack))


def generate_project_summary(tech_stack, files):

    prompt = f"""
    Tech Stack: {tech_stack}
    Files: {[file['name'] for file in files]}

    Explain in 4-5 lines what this project likely does.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


@app.post("/create-workspace")
def create_workspace(data: WorkspaceCreate):

    files = fetch_repo_files(data.repo_url)
    tech_stack = detect_tech_stack(files)
    summary = generate_project_summary(tech_stack, files)

    workspace_ref = db.collection("users") \
                      .document(data.user_id) \
                      .collection("workspaces") \
                      .document()

    workspace_ref.set({
        "name": data.name,
        "repo_url": data.repo_url,
        "tech_stack": tech_stack,
        "project_summary": summary,
        "created_at": datetime.utcnow()
    })

    # ✅ SAVE FILES INTO SUBCOLLECTION
    for file in files:
        workspace_ref.collection("files").add({
            "file_name": file.get("name"),
            "path": file.get("path"),
            "download_url": file.get("download_url"),
            "type": file.get("type")
        })

    return {
        "workspace_id": workspace_ref.id,
        "tech_stack": tech_stack,
        "summary": summary
    }


@app.get("/user/{user_id}/workspaces")
def get_user_workspaces(user_id: str):

    workspaces = db.collection("users") \
                   .document(user_id) \
                   .collection("workspaces") \
                   .stream()

    result = []

    for ws in workspaces:
        data = ws.to_dict()
        data["id"] = ws.id
        result.append(data)

    return result

@app.post("/generate-docs")
def generate_docs(data: DocumentationRequest):

    workspace = db.collection("users") \
                  .document(data.user_id) \
                  .collection("workspaces") \
                  .document(data.workspace_id) \
                  .get() \
                  .to_dict()

    if not workspace:
        return {"error": "Workspace not found"}

    prompt = f"""
    Project Summary:
    {workspace['project_summary']}

    Tech Stack:
    {workspace['tech_stack']}

    Generate {data.doc_type} documentation for this project.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    return {"documentation": response.choices[0].message.content}

# ================================
# EDGE CASE PROMPT
# ================================

def build_edge_case_prompt(code: str, language: str):
    return f"""
You are a strict QA engineer.

Return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include backticks.

Return strictly in this format:

{{
  "edge_test_cases": [
    {{
      "input": {{ }},
      "expected_behavior": ""
    }}
  ]
}}

Rules:
- Minimum 5 test cases
- Include runtime error cases
- Include boundary values
- Include invalid input types
- Include extreme values
- Ensure JSON is valid

Code:
{code}
"""


# ================================
# EDGE CASE ENDPOINT (FIXED)
# ================================

@app.post("/edge-cases")
def generate_edge_cases(request: EdgeCaseRequest):

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if request.language.lower() not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language")

    prompt = build_edge_case_prompt(request.code, request.language)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=1200
    )

    raw = response.choices[0].message.content.strip()

    # Remove markdown completely
    raw = raw.replace("```json", "").replace("```", "").strip()

    # Extract JSON safely
    match = re.search(r"\{[\s\S]*\}", raw)

    if not match:
        return {
            "edge_test_cases": [],
            "error": "Model did not return valid JSON",
            "debug_output": raw
        }

    try:
        parsed = json.loads(match.group())

        if "edge_test_cases" not in parsed:
            return {
                "edge_test_cases": [],
                "error": "Missing edge_test_cases key",
                "debug_output": raw
            }

        return parsed

    except Exception as e:
        return {
            "edge_test_cases": [],
            "error": "JSON parsing failed",
            "debug_output": raw
        }
