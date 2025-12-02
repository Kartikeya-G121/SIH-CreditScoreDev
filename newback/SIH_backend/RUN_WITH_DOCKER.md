# Run with Docker

This guide explains how to run the entire application (Backend, OCR Service, Database, Redis) using Docker.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

## Setup on a New Machine (Cloning the Repo)

If you have cloned this repository to a new machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd Generated_Documentation
    ```

2.  **Create Environment File**:
    The application requires an `.env` file for sensitive configuration (Database credentials, API keys, etc.). This file is **not** committed to Git for security.
    
    Copy the example file to create your local `.env`:
    ```bash
    cp .env.example .env
    ```
    
    Open `.env` and fill in the required values:
    - `SUPABASE_*`: Your Supabase configuration.
    - `SMTP_*`: Your email server credentials.
    - `JWT_SECRET`: A secure random string.
    - `FAST2SMS_API_KEY`: Your SMS API key.

3.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```

## Quick Start (Existing Setup)

1.  **Stop any running services**:
    Ensure ports 8080, 5000, 5432, and 6379 are free.

2.  **Run**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the Application**:
    - **Backend API**: [http://localhost:8080](http://localhost:8080)
    - **OCR Service**: [http://localhost:5000](http://localhost:5000)
    - **Database**: Port `5432` (User: `postgres`, Password: `postgres`, DB: `income_processing_db`)

## Services

- **backend**: The Spring Boot application.
- **ocr-service**: The Python Flask application for OCR processing.
- **postgres**: PostgreSQL database.
- **redis**: Redis cache.

## Environment Variables

The `docker-compose.yml` file reads from your `.env` file and passes the variables to the containers.
- The backend connects to Postgres at `jdbc:postgresql://postgres:5432/income_processing_db`.
- The backend connects to Redis at `redis:6379`.
- The backend connects to OCR Service at `http://ocr-service:5000`.

## Troubleshooting

- **Port Conflicts**: Ensure ports 8080, 5000, 5432, and 6379 are free.
- **Database Initialization**: The `master_schema.sql` file is mounted to initialize the database on the first run. If you need to reset the DB, stop the containers and remove the volume:
    ```bash
    docker-compose down -v
    docker-compose up --build
    ```
