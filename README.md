# CodeCatalyst

PPT link: https://www.canva.com/design/DAHBATDO_5Y/TdYCGs6mO9H4_hdvxx0OGg/edit?utm_content=DAHBATDO_5Y&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

## Overview 
It is an integrated code enhancement platform designed to streamline the software development process by providing testing, debugging, optimization, and AI-powered code improvement within a single interface.
It allows developers to write, analyze, execute, and enhance code in real-time — reducing manual effort and improving overall code quality.

## Features

- **AI Code Review & Debugging** – Finds bugs, errors, and inefficiencies with improvement suggestions
- **Code Optimization** – Produces optimized code with explanations and complexity comparison
- **Code Execution & Testing** – Run and test code within the platform
- **Edge Case Generation** – Creates boundary and corner test cases for robust testing
- **Code Generation** – Generates code from user prompts
- **Workspace Management** – Manage multiple development workspaces
- **GitHub Repository Upload** – Analyze entire repositories
- **Comment Generation** – Automatically generates meaningful comments for the given code

## Tech Stack

**Frontend**
- React JS  
- Monaco Editor  
- CSS  

**Backend**
- FastAPI (Python)  
- Groq API (LLM Integration)  

**Database**
- Firebase

## Installation & Setup
1. Clone the repository
2. Backend Setup
- cd backend
- pip install -r requirements.txt
- uvicorn main:app --reload
3. Frontend Setup 
- cd frontend
- npm install
- npm start
