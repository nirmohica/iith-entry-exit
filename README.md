# Gate Access System

A web-based visitor entry/exit system for gated premises, developed because walking to the gate every time a visitor shows up is a slow descent into madness. This project includes OTP validation, access logging, and basic UI to replace your building’s deeply trusting and totally ineffective logbook.

> “Secure by design. Ignored by institutions.”

### Screenshots

<img src="/assets/screenshot_2.jpeg" width="100%">

<p align="center">
  <img src="/assets/screenshot_3.jpeg" width="48%">
&nbsp;
  <img src="/assets/screenshot_4.jpeg" width="48%">
</p>

---

## Features

- Resident entry/exit tracking
- Visitor entry with OTP-based validation
- Resident search with dynamic dropdown
- Visitor history logs
- Works on a local PostgreSQL + Node.js + TypeScript stack
- UI so clean, even your Warden might understand it

---

## Tech Stack

| Layer        | Tech             |
|--------------|------------------|
| **Frontend** | TypeScript, SCSS, HTML |
| **Backend**  | Node.js, Express |
| **Database** | PostgreSQL       |
| **Email**    | SendGrid         |

---

## Project Structure

```
.
├── server         # Express backend (routes, db queries)
├── src            # Frontend scripts + styles + HTML
├── database       # SQL schema and stored procedures
├── assets         # Images, video, etc.
```

---

## Setup Instructions

### 1. Clone this glorious pile of effort:

```bash
git clone https://github.com/yourname/gate-access-system.git
cd gate-access-system
```

2. Install dependencies

```
npm install
```
3. Create a .env file

```
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=gateAccess
DB_HOST=localhost
DB_PORT=5432

SENDGRID_API_KEY=your_sendgrid_api_key
```

4. Initialize the database

Inside `/database/`:
```
psql -U your_user -d gateAccess -f schema.sql
psql -U your_user -d gateAccess -f stored_procedures_and_functions.sql
psql -U your_user -d gateAccess -f seed.sql
```

5. Run the server

```
npm run dev
```
---

### 🤡 Known Issues

- Nobody uses it.
- Authority figures have opinions.
- You might care too much.

### Possible Improvements

- Face recognition (but make it ethical)
- Proper role-based access control
- Visitor QR codes
- Dark mode that actually saves your soul


### 🪦 Final Thoughts

This system was built with love, frustration, and a tragic understanding that the best ideas are sometimes killed by committee. If you’re reading this and actually want to use it—thank you.

If you’re reading this and plan to suggest a “more scalable blockchain-based solution,” please close the tab.

---

### Author

~~ChatGPT~~ Anup Chavan
