// ─────────────────────────────────────────────────────────────
//  Azure Cloud Assessment Portal  |  scripts.js
//
//  ⚙️  CONFIGURE: Set your GitHub raw base URL below.
//  After pushing scripts/ folder to GitHub, replace the value:
//  Example: https://raw.githubusercontent.com/YourUser/YourRepo/main/scripts
// ─────────────────────────────────────────────────────────────

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/scripts";

// ── Checklist definitions ──────────────────────────────────────
const CHECKLISTS = {

    iam: {
        title: "IAM & Identity Audit",
        desc: "Assesses users, MFA, RBAC roles, service principals & guest accounts",
        file: "IAM_Audit.ps1",
        report: "AzureIAM_Report.html",
        color: "#0078D4"
    },

    storage: {
        title: "Storage Security Audit",
        desc: "Checks encryption, public access, HTTPS enforcement & soft delete",
        file: "Storage_Audit.ps1",
        report: "AzureStorage_Report.html",
        color: "#00b294"
    },

    network: {
        title: "Network Security Audit",
        desc: "Reviews NSGs, open ports, public IPs, VNet peering & DDoS protection",
        file: "Network_Audit.ps1",
        report: "AzureNetwork_Report.html",
        color: "#e74c3c"
    },

    vm: {
        title: "Virtual Machine Security",
        desc: "Audits disk encryption, Defender, managed identity & JIT access",
        file: "VM_Audit.ps1",
        report: "AzureVM_Report.html",
        color: "#9b59b6"
    },

    defender: {
        title: "Defender & Monitoring Audit",
        desc: "Checks Defender for Cloud plans, alerts & Log Analytics workspace",
        file: "Defender_Audit.ps1",
        report: "AzureDefender_Report.html",
        color: "#f39c12"
    },

    full: {
        title: "Full Compliance Assessment",
        desc: "50+ checks: IAM, Storage, Network, VM, Defender, Key Vault & more",
        file: "Full_Assessment.ps1",
        report: "AzureFullAssessment_Report.html",
        color: "#1abc9c"
    }
};

// ── UI Logic ───────────────────────────────────────────────────
let selectedKey = null;

function selectCard(el) {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected', 'pulse-once'));
    el.classList.add('selected', 'pulse-once');
    selectedKey = el.dataset.checklist;

    const cl = CHECKLISTS[selectedKey];
    const rawUrl = `${GITHUB_RAW_BASE}/${cl.file}`;
    const command = `irm "${rawUrl}" | iex`;

    document.getElementById('scriptTitle').textContent = cl.title;
    document.getElementById('scriptDesc').textContent = cl.desc;
    document.getElementById('reportFileName').textContent = cl.report;
    document.getElementById('commandLine').textContent = command;
    document.getElementById('ps1FileLink').href = rawUrl;
    document.getElementById('ps1FileLink').textContent = cl.file;

    const section = document.getElementById('scriptSection');
    section.classList.add('visible');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeScript() {
    document.getElementById('scriptSection').classList.remove('visible');
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    selectedKey = null;
}

function copyCommand() {
    if (!selectedKey) return;
    const cl = CHECKLISTS[selectedKey];
    const rawUrl = `${GITHUB_RAW_BASE}/${cl.file}`;
    const command = `irm "${rawUrl}" | iex`;

    navigator.clipboard.writeText(command).then(() => {
        const btn = document.getElementById('copyBtn');
        const orig = btn.innerHTML;
        btn.innerHTML = '✔ Copied!';
        btn.style.background = 'linear-gradient(135deg,#00c87a,#007a4d)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = `irm "${GITHUB_RAW_BASE}/${cl.file}" | iex`;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Command copied!');
    });
}

function openCloudShell() {
    window.open('https://portal.azure.com/#cloudshell/', '_blank');
}
