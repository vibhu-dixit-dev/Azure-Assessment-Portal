# ☁ Azure Cloud Assessment Portal

A **single-page web portal** for Azure Cloud Security Assessments.  
Select a checklist → copy a one-liner PowerShell command → paste in Azure Cloud Shell → get a professional HTML report on your laptop.

---

## 🚀 How It Works

1. Open `index.html` in your browser
2. Select a checklist category (IAM, Storage, Network, VM, Defender, or Full Compliance)
3. Portal shows a one-liner command:
   ```powershell
   irm "https://raw.githubusercontent.com/vibhu-dixit-dev/azure-assessment-portal/main/scripts/IAM_Audit.ps1" | iex
   ```
4. Paste in **Azure Cloud Shell** → script runs all checks automatically
5. Download the generated HTML report using Cloud Shell's **↑↓** button

---

## 📂 Structure

```
├── index.html              ← Portal UI (open this)
├── style.css               ← Dark theme styling
├── scripts.js              ← Portal logic + GitHub URL config
└── scripts/
    ├── IAM_Audit.ps1       ← IAM & Identity checks
    ├── Storage_Audit.ps1   ← Storage security checks
    ├── Network_Audit.ps1   ← Network & NSG checks
    ├── VM_Audit.ps1        ← Virtual Machine checks
    ├── Defender_Audit.ps1  ← Defender for Cloud checks
    └── Full_Assessment.ps1 ← 50+ checks (all categories)
```

---

## ✅ Assessment Categories

| Checklist | Checks | What It Covers |
|---|---|---|
| IAM & Identity | 12 | Users, Guests, RBAC, Service Principals |
| Storage Security | 10 | Encryption, Public Access, HTTPS, TLS, Soft Delete |
| Network Security | 14 | NSGs, Open Ports, Public IPs, DDoS, VNets |
| VM Security | 11 | Disk Encryption, Managed Identity, Public IP on VM |
| Defender & Monitoring | 9 | Defender Plans, Alerts, Security Contacts, Log Analytics |
| Full Compliance | 50+ | All of the above + Key Vault |

---

## 📊 Report Features

Each generated HTML report includes:
- **Security Score** (0–100%)
- ✔ **PASS** / ✘ **FAIL** / ⚠ **WARN** color-coded table
- Summary cards (Total / Passed / Failed / Warnings)
- Subscription name & timestamp

---

## ⚙️ Setup

After cloning, open `scripts.js` and set your GitHub raw URL on line 9:

```js
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/scripts";
```

---

## 🛠 Requirements

- Azure PowerShell module (`Az`) installed in Cloud Shell (pre-installed by default)
- Azure account with read permissions on the subscription

---

*Built for Azure Cloud Security Assessments | Powered by PowerShell Automation*
