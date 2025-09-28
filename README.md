# React Records & Command UI

A **React 19 + TypeScript + Ant Design** frontend application for managing records and running commands.  
Users can **create, view, search, delete records, execute commands, and view outputs** with an accessible and user-friendly interface.

---

## Table of Contents

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Project Structure](#project-structure)  
4. [Setup & Installation](#setup--installation)  
5. [Usage](#usage)  
6. [Accessibility](#accessibility)  
7. [Testing](#testing)  
8. [Contributing](#contributing)  
9. [License](#license)  
10. [Contact](#contact)  

---

## Features

- **Records Management**
  - Create new records via modal form
  - View records in a table with pagination
  - Search records with debounced input
  - Delete records with confirmation and optimistic updates

- **Command Runner**
  - Execute commands for selected records
  - View command output in a scrollable drawer
  - Supports async operations with loading states

- **Accessibility & Usability**
  - Keyboard navigation (tab order, focus management)
  - ARIA labels for interactive elements
  - Visible focus outlines
  - Responsive design for desktop and mobile
  - Notifications for success/failure

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Ant Design  
- **State Management / Data Fetching:** React Query (optional)  
- **HTTP Requests:** Axios  
- **Routing:** React Router DOM  
- **Utilities:** lodash.debounce  
- **Testing:** Vitest, React Testing Library  
- **Linting / Formatting:** ESLint, Prettier  

---

##Usage

Navigate to Records page to view all records.
Use the Search bar to filter records in real-time.
Click Add Record to create a new record.
Click Delete to remove a record (with confirmation).
Click Run to execute commands and view output in a drawer.
