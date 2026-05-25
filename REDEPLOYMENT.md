# 🚀 Sonic DNA Audit App - Redeployment Guide

This document contains step-by-step instructions on how to commit/push development updates and redeploy them to the Proxmox LXC production container.

---

## 1. Local Development (Pushing Updates)

Run these commands from your local workspace root directory (`/home/jackc/projects/sonic-dna`):

### Stage the changes
Add all the updated and new files to the git staging area:
```bash
git add .
```

### Commit the changes
Create a commit with a descriptive message detailing the refinements:
```bash
git commit -m "feat: implement UI/UX refinements, branding alignment, dynamic footer sync, compact kanban cards, collapsible trash accordions, and profile mutations"
```

### Push to remote repository
Push your local branch commits to the remote origin:
```bash
git push origin main
```

---

## 2. Remote Proxmox LXC Container (Redeployment)

Log into the Proxmox container (via SSH or from the Proxmox host using `pct enter <vmid>`) and execute the following commands:

### Navigate to the repository
```bash
cd /opt/sonic-dna
```

### Stop the active application service
```bash
sudo systemctl stop sonic-dna
```

### Pull the latest updates
```bash
git pull origin main
```

### Update dependencies and rebuild frontend
Ensure all dependencies are synced and that the React production files are rebuilt:
```bash
# Update root dependencies
npm install

# Update and install server dependencies
cd server && npm install && cd ..

# Update, install client dependencies, and build production assets
cd client && npm install && npm run build && cd ..
```

### Restart the application service
```bash
sudo systemctl start sonic-dna
```

### Verify the deployment status
Check the logs and service health status:
```bash
sudo systemctl status sonic-dna
```

To view rolling logs if troubleshooting is required:
```bash
journalctl -u sonic-dna -f -n 100
```
