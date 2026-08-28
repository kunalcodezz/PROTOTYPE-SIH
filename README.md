# PROTOTYPE-SIH

A web-based prototype developed for the **Smart India Hackathon (SIH)** project.

##  Prerequisites

Before running the project, make sure you have installed:

* [Node.js](https://nodejs.org/) (LTS version recommended)
* npm (comes with Node.js)
* Git
* VS Code or any preferred code editor

##  How to Run the Project

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/kunalcodezz/PROTOTYPE-SIH.git
```

### 2. Open the Project

Move into the project folder:

```bash
cd PROTOTYPE-SIH
```

You can also open the folder directly in VS Code:

```bash
code .
```

### 3. Install Dependencies

Run:

```bash
npm install
```

This will install all the required packages.

### 4. Start the Development Server

Run:

```bash
npm run dev
```

After starting the server, the terminal will show a local URL similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

##  Stopping the Project

To stop the development server, press:

```text
Ctrl + C
```

##  Running the Project Again

Whenever you want to run the project again:

```bash
cd PROTOTYPE-SIH
npm install
npm run dev
```

> `npm install` is only required when dependencies have changed or after a fresh clone. Normally, after the first installation, you can simply run `npm run dev`.

##  Project Structure

```text
PROTOTYPE-SIH/
│
├── public/          # Public/static assets
├── src/             # Main source code
├── package.json     # Project dependencies and scripts
├── package-lock.json
├── .gitignore
└── README.md
```

##  Environment Variables

If the project uses environment variables, create a `.env` file in the project root.

Example:

```env
VITE_API_KEY=your_api_key
```

**Do not upload `.env` to GitHub.**

Make sure `.env` is included in `.gitignore`.

##  Development

After running the development server, changes made inside the source code will generally appear automatically in the browser through hot reload.

##  Build for Production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

##  Team

Developed as part of the **Smart India Hackathon (SIH)**.

---

 If you find this project useful, consider giving the repository a star.
