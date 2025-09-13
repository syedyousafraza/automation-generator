# 🚀 Automation Framework Generator

This project is a **Playwright-based Automation Framework Generator** that allows users to generate a ready-to-use test automation framework with a single API call.  
The generated framework includes test scripts, config files, and utilities for robust web and API automation.

---

## ✨ Features
- ⚡ **Playwright-based** test framework  
- 🧩 **Page Object Model (POM)** structure  
- 🔐 Optional **Authentication Support** (username/password)  
- 🌍 **Environment switching** (`dev`, `staging`, `prod`)  
- 📡 **API testing** with `curl` examples  
- 📊 Built-in **reporting** and configuration  
- 📦 **Export-ready**: users only need to run `npm install`

---

---

## ⚙️ Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/your-username/automation-generator.git
cd automation-generator
npm install


```
## ⚙️ running the server
```bash
node server.js
```

## ⚙️ API USAGE 
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "demo-tests",
    "url": "https://example.com",
    "username": "test@example.com",
    "password": "mypassword",
    "environments": {
      "dev": "https://dev.example.com",
      "staging": "https://staging.example.com",
      "prod": "https://example.com"
    }
  }'
```




