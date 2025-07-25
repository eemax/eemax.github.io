---
title:
source: "https://gitingest.com/llm.txt"
created: 2025-07-15
---
# GitIngest – **AI Agent Integration Guide**

Turn any Git repository into a prompt-ready text digest. GitIngest fetches, cleans, and formats source code so AI agents and Large Language Models can reason over complete projects programmatically.

**🤖 For AI Agents**: Use CLI or Python package for automated integration. Web UI is designed for human interaction only.

---
## 1. Installation

### 1.1 CLI Installation (Recommended for Scripts & Automation)
```bash
# Best practice: Use pipx for CLI tools (isolated environment)
pipx install gitingest

# Alternative: Use pip (may conflict with other packages)
pip install gitingest

# Verify installation
gitingest --help
```

### 1.2 Python Package Installation (For Code Integration)
```bash
# For projects/notebooks: Use pip in virtual environment
python -m venv gitingest-env
source gitingest-env/bin/activate  # On Windows: gitingest-env\Scripts\activate
pip install gitingest

# Or add to requirements.txt
echo "gitingest" >> requirements.txt
pip install -r requirements.txt

# For development: Install with dev dependencies
pip install gitingest[dev]
```

### 1.3 Installation Verification
```bash
# Test CLI installation
gitingest --version

# Test Python package
python -c "from gitingest import ingest; print('GitIngest installed successfully')"

# Quick functionality test
gitingest https://github.com/octocat/Hello-World -o test_output.txt
```

---
## 2. Quick-Start for AI Agents
| Method | Best for | One-liner |
|--------|----------|-----------|
| **CLI** | Scripts, automation, pipelines | `gitingest https://github.com/user/repo -o - \| your-llm` |
| **Python** | Code integration, notebooks, async tasks | `from gitingest import ingest; s,t,c = ingest('repo-url'); process(c)` |
| **URL Hack** | Quick web scraping (limited) | Replace `github.com` → `gitingest.com` in any GitHub URL |
| **Web UI** | **Human use only** | ~~Not recommended for AI agents~~ |

---
## 3. Output Format for AI Processing
GitIngest returns **structured plain-text** optimized for LLM consumption with three distinct sections:

### 3.1 Repository Summary
```
Repository: owner/repo-name
Files analyzed: 42
Estimated tokens: 15.2k
```
Contains basic metadata: repository name, file count, and token estimation for LLM planning.

### 3.2 Directory Structure
```
Directory structure:
└── project-name/
    ├── src/
    │   ├── main.py
    │   └── utils.py
    ├── tests/
    │   └── test_main.py
    └── README.md
```
Hierarchical tree view showing the complete project structure for context and navigation.

### 3.3 File Contents
Each file is wrapped with clear delimiters:
```
================================================
FILE: src/main.py
================================================
def hello_world():
    print("Hello, World!")

if __name__ == "__main__":
    hello_world()


================================================
FILE: README.md
================================================
# Project Title

This is a sample project...
```

### 3.4 Usage Example
```python
# Python package usage
from gitingest import ingest

summary, tree, content = ingest("https://github.com/octocat/Hello-World")

# Returns exactly:
# summary = "Repository: octocat/hello-world\nFiles analyzed: 1\nEstimated tokens: 29"
# tree = "Directory structure:\n└── octocat-hello-world/\n    └── README"
# content = "================================================\nFILE: README\n================================================\nHello World!\n\n\n"

# For AI processing, combine all sections:
full_context = f"{summary}\n\n{tree}\n\n{content}"
```

```bash
# CLI usage - pipe directly to your AI system
gitingest https://github.com/octocat/Hello-World -o - | your_llm_processor

# Output streams the complete formatted text:
# Repository: octocat/hello-world
# Files analyzed: 1
# Estimated tokens: 29
#
# Directory structure:
# └── octocat-hello-world/
#     └── README
#
# ================================================
# FILE: README
# ================================================
# Hello World!
```



---
## 4. AI Agent Integration Methods

### 4.1 CLI Integration (Recommended for Automation)
```bash
# Basic usage - pipe directly to your AI system
gitingest https://github.com/user/repo -o - | your_ai_processor

# Advanced filtering for focused analysis (long flags)
gitingest https://github.com/user/repo \
  --include-pattern "*.py" --include-pattern "*.js" --include-pattern "*.md" \
  --max-size 102400 \
  -o - | python your_analyzer.py

# Same command with short flags (more concise)
gitingest https://github.com/user/repo \
  -i "*.py" -i "*.js" -i "*.md" \
  -s 102400 \
  -o - | python your_analyzer.py

# Exclude unwanted files and directories (long flags)
gitingest https://github.com/user/repo \
  --exclude-pattern "node_modules/*" --exclude-pattern "*.log" \
  --exclude-pattern "dist/*" \
  -o - | your_analyzer

# Same with short flags
gitingest https://github.com/user/repo \
  -e "node_modules/*" -e "*.log" -e "dist/*" \
  -o - | your_analyzer

# Private repositories with token (short flag)
export GITHUB_TOKEN="ghp_your_token_here"
gitingest https://github.com/user/private-repo -t $GITHUB_TOKEN -o -

# Specific branch analysis (short flag)
gitingest https://github.com/user/repo -b main -o -

# Save to file (default: digest.txt in current directory)
gitingest https://github.com/user/repo -o my_analysis.txt

# Ultra-concise example for small files only
gitingest https://github.com/user/repo -i "*.py" -s 51200 -o -
```

**Key Parameters for AI Agents**:
- `-s` / `--max-size`: Maximum file size in bytes to process (default: no limit)
- `-i` / `--include-pattern`: Include files matching Unix shell-style wildcards
- `-e` / `--exclude-pattern`: Exclude files matching Unix shell-style wildcards
- `-b` / `--branch`: Specify branch to analyze (defaults to repository's default branch)
- `-t` / `--token`: GitHub personal access token for private repositories
- `-o` / `--output`: Stream to STDOUT with `-` (default saves to `digest.txt`)

### 4.2 Python Package (Best for Code Integration)
```python
from gitingest import ingest, ingest_async
import asyncio

# Synchronous processing
def analyze_repository(repo_url: str):
    summary, tree, content = ingest(repo_url)

    # Process metadata
    repo_info = parse_summary(summary)

    # Analyze structure
    file_structure = parse_tree(tree)

    # Process code content
    return analyze_code(content)

# Asynchronous processing (recommended for AI services)
async def batch_analyze_repos(repo_urls: list):
    tasks = [ingest_async(url) for url in repo_urls]
    results = await asyncio.gather(*tasks)
    return [process_repo_data(*result) for result in results]

# Memory-efficient processing for large repos
def stream_process_repo(repo_url: str):
    summary, tree, content = ingest(
        repo_url,
        max_file_size=51200,  # 50KB max per file
        include_patterns=["*.py", "*.js"],  # Focus on code files
    )

    # Process in chunks to manage memory
    for file_content in split_content(content):
        yield analyze_file(file_content)

# Filtering with exclude patterns
def analyze_without_deps(repo_url: str):
    summary, tree, content = ingest(
        repo_url,
        exclude_patterns=[
            "node_modules/*", "*.lock", "dist/*",
            "build/*", "*.min.js", "*.log"
        ]
    )
    return analyze_code(content)
```

**Python Integration Patterns**:
- **Batch Processing**: Use `ingest_async` for multiple repositories
- **Memory Management**: Use `max_file_size` and pattern filtering for large repos
- **Error Handling**: Wrap in try-catch for network/auth issues
- **Caching**: Store results to avoid repeated API calls
- **Pattern Filtering**: Use `include_patterns` and `exclude_patterns` lists

### 4.3 Web UI (❌ Not for AI Agents)
The web interface at `https://gitingest.com` is designed for **human interaction only**.

**Why AI agents should avoid the web UI**:
- Requires manual interaction and browser automation
- No programmatic access to results
- Rate limiting and CAPTCHA protection
- Inefficient for automated workflows

**Use CLI or Python package instead** for all AI agent integrations.

---
## 5. AI Agent Best Practices

### 5.1 Repository Analysis Workflows
```python
# Pattern 1: Full repository analysis
def full_repo_analysis(repo_url: str):
    summary, tree, content = ingest(repo_url)
    return {
        'metadata': extract_metadata(summary),
        'structure': analyze_structure(tree),
        'code_analysis': analyze_all_files(content),
        'insights': generate_insights(summary, tree, content)
    }

# Pattern 2: Selective file processing
def selective_analysis(repo_url: str, file_patterns: list):
    summary, tree, content = ingest(
        repo_url,
        include_patterns=file_patterns
    )
    return focused_analysis(content)

# Pattern 3: Streaming for large repos
def stream_analysis(repo_url: str):
    # First pass: get structure and metadata only
    summary, tree, _ = ingest(
        repo_url,
        include_patterns=["*.md", "*.txt"],
        max_file_size=10240  # 10KB limit for docs
    )

    # Then process code files selectively by language
    for pattern in ["*.py", "*.js", "*.go", "*.rs"]:
        _, _, content = ingest(
            repo_url,
            include_patterns=[pattern],
            max_file_size=51200  # 50KB limit for code
        )
        yield process_language_specific(content, pattern)
```

### 5.2 Error Handling for AI Agents
```python
from gitingest import ingest
from gitingest.utils.exceptions import GitIngestError
import time

def robust_ingest(repo_url: str, retries: int = 3):
    for attempt in range(retries):
        try:
            return ingest(repo_url)
        except GitIngestError as e:
            if attempt == retries - 1:
                return None, None, f"Failed to ingest: {e}"
            time.sleep(2 ** attempt)  # Exponential backoff
```

### 5.3 Private Repository Access
```python
import os
from gitingest import ingest

# Method 1: Environment variable
def ingest_private_repo(repo_url: str):
    token = os.getenv('GITHUB_TOKEN')
    if not token:
        raise ValueError("GITHUB_TOKEN environment variable required")
    return ingest(repo_url, token=token)

# Method 2: Secure token management
def ingest_with_token_rotation(repo_url: str, token_manager):
    token = token_manager.get_active_token()
    try:
        return ingest(repo_url, token=token)
    except AuthenticationError:
        token = token_manager.rotate_token()
        return ingest(repo_url, token=token)
```

---
## 6. Integration Scenarios for AI Agents

| Use Case | Recommended Method | Example Implementation |
|----------|-------------------|----------------------|
| **Code Review Bot** | Python async | `await ingest_async(pr_repo)` → analyze changes |
| **Documentation Generator** | CLI with filtering | `gitingest repo -i "*.py" -i "*.md" -o -` |
| **Vulnerability Scanner** | Python with error handling | Batch process multiple repos |
| **Code Search Engine** | CLI → Vector DB | `gitingest repo -o - \| embed \| store` |
| **AI Coding Assistant** | Python integration | Load repo context into conversation |
| **CI/CD Analysis** | CLI integration | `gitingest repo -o - \| analyze_pipeline` |
| **Repository Summarization** | Python with streaming | Process large repos in chunks |
| **Dependency Analysis** | CLI exclude patterns | `gitingest repo -e "node_modules/*" -e "*.lock" -o -` |
| **Security Audit** | CLI with size limits | `gitingest repo -i "*.py" -i "*.js" -s 204800 -o -` |

---
## 7. Support & Resources for AI Developers
* **Web UI official instance**: https://gitingest.com
* **GitHub Repository**: https://github.com/cyclotruc/gitingest
* **Python Package**: https://pypi.org/project/gitingest/
* **Community Support**: https://discord.gg/zerRaGK9EC

_GitIngest – Purpose-built for AI agents to understand entire codebases programmatically._