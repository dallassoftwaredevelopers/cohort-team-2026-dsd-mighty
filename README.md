# Property Bill Automation

A full-stack application developed by **DSD Mighty**, a team from the **Dallas Software Developers 2026 Cohort**.

Property management companies handle hundreds of bills across multiple properties, each with different vendors, due dates, payment methods, and approval requirements.

This project aims to simplify that process by building a system for collecting bills, matching them to the correct properties, detecting duplicates, managing approvals, and tracking payment workflows.

The project will start with traditional software engineering approaches, with AI-powered capabilities introduced in later development phases.

## Technology Stack

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com/) for the Python backend API.
- 🐍 [**Python**](https://www.python.org/) for backend development.
- 📦 [**uv**](https://docs.astral.sh/uv/) for Python dependency management and locking.
- ✅ [**pytest**](https://docs.pytest.org/) for automated backend tests.
- 🔄 [**GitHub Actions**](https://docs.github.com/en/actions) for continuous integration.
- 🖥️ **Frontend:** Not yet implemented.

## Meet the Team

Built collaboratively by members of the Dallas Software Developers 2026 cohort. 
| Team Member | GitHub | LinkedIn | Portfolio |
| :--- | :--- | :--- | :--- |
| **Kervintz Noel** | [@kervcodes](https://github.com/kervcodes) | [LinkedIn](https://www.linkedin.com/in/kervintznoel/) | [Website](https://kervintznoel.com/) |
| **Member Name** | [GitHub](https://github.com/) | — | — |
| **Member Name** | [GitHub](https://github.com/) | — | — |
| **Member Name** | [GitHub](https://github.com/) | — | — |
| **Member Name** | [GitHub](https://github.com/) | — | — |
| **Member Name** | [GitHub](https://github.com/) | — | — |


## Project Structure

```text
cohort-team-2026-dsd-mighty/
├── .github/
│   └── workflows/        # CI configuration
├── backend/
│   ├── src/
│   │   └── backend/      # FastAPI application package
│   ├── tests/            # Backend tests
│   ├── pyproject.toml    # Project and dependency configuration
│   └── uv.lock           # Locked Python dependencies
├── frontend/             # Reserved for the frontend application
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install [Python](https://www.python.org/downloads/) and [uv](https://docs.astral.sh/uv/getting-started/installation/).

### Backend Development

From the repository root:

```bash
cd backend
uv sync
uv run uvicorn backend.app:app --reload
```

Once the server is running:

- **API:** http://127.0.0.1:8000/
- **Interactive API documentation:** http://127.0.0.1:8000/docs
- **Alternative API documentation:** http://127.0.0.1:8000/redoc

### Running Tests

From the `backend/` directory:

```bash
uv run pytest
```

## Frontend Development

The frontend has not been initialized yet. Setup instructions will be added when the team chooses and configures the frontend stack.

## Continuous Integration

GitHub Actions configuration lives in [`.github/workflows/`](./.github/workflows/). The backend workflow is intended to install dependencies and run automated checks on changes to the repository.

## Project Status

**In development — foundation setup.** The FastAPI backend and a basic test are in place. The frontend and application-specific features are not yet implemented.
