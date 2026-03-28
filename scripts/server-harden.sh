#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# server-harden.sh — Comprehensive security hardening for Luminify server
# Run as root on Ubuntu 24.04 LTS
# Usage: bash server-harden.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LOGFILE="/var/log/luminify-harden.log"
echo "[$(date)] Starting security hardening" | tee -a "$LOGFILE"

# ── 1. SSH Hardening ────────────────────────────────────────────────────────
echo "[*] Hardening SSH..."

# Write a drop-in config that overrides everything in sshd_config
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# Luminify hardening — overrides /etc/ssh/sshd_config
PasswordAuthentication no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
MaxSessions 5
AllowAgentForwarding no
AllowTcpForwarding no
PrintMotd no
Banner none
EOF

chmod 600 /etc/ssh/sshd_config.d/99-hardening.conf

# Validate config before restart
if ! sshd -t; then
  echo "ERROR: SSH config invalid, skipping restart" | tee -a "$LOGFILE"
else
  systemctl restart ssh
  echo "OK: SSH restarted with hardened config" | tee -a "$LOGFILE"
fi

# ── 2. Kernel (sysctl) Hardening ────────────────────────────────────────────
echo "[*] Applying kernel hardening (sysctl)..."

cat > /etc/sysctl.d/99-luminify-hardening.conf << 'EOF'
# ── Network: ignore ICMP redirects and broadcasts ──────────────────────────
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# ── SYN flood protection ────────────────────────────────────────────────────
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# ── IPv6: disable if not needed (comment out if using IPv6) ─────────────────
# net.ipv6.conf.all.disable_ipv6 = 1

# ── Memory: disable core dumps, protect pointers ────────────────────────────
kernel.core_uses_pid = 1
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.sysrq = 0
kernel.randomize_va_space = 2

# ── File system ──────────────────────────────────────────────────────────────
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
fs.suid_dumpable = 0
EOF

sysctl -p /etc/sysctl.d/99-luminify-hardening.conf 2>&1 | tee -a "$LOGFILE"
echo "OK: sysctl applied" | tee -a "$LOGFILE"

# ── 3. Disable Unnecessary Services ─────────────────────────────────────────
echo "[*] Disabling unnecessary services..."

SERVICES_TO_DISABLE=(
  ModemManager
  udisks2
  apport
  avahi-daemon
  cups
)

for svc in "${SERVICES_TO_DISABLE[@]}"; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    systemctl stop "$svc"
    systemctl disable "$svc"
    echo "OK: Stopped and disabled $svc" | tee -a "$LOGFILE"
  elif systemctl list-unit-files --quiet "$svc.service" 2>/dev/null | grep -q "$svc"; then
    systemctl disable "$svc" 2>/dev/null || true
    echo "OK: Disabled $svc (was not running)" | tee -a "$LOGFILE"
  else
    echo "SKIP: $svc not found" | tee -a "$LOGFILE"
  fi
done

# ── 4. Docker Daemon Security Options ───────────────────────────────────────
echo "[*] Configuring Docker daemon security..."

mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "no-new-privileges": true,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "icc": false,
  "live-restore": true,
  "userland-proxy": false
}
EOF

systemctl reload docker 2>/dev/null || systemctl restart docker
echo "OK: Docker daemon hardened" | tee -a "$LOGFILE"

# ── 5. UFW Rules Verification & Tightening ──────────────────────────────────
echo "[*] Verifying UFW rules..."
ufw status numbered | tee -a "$LOGFILE"

# Ensure rate limiting on SSH
ufw delete allow 22/tcp 2>/dev/null || true
ufw limit 22/tcp comment 'SSH rate limit'
ufw reload
echo "OK: UFW SSH changed to rate-limited" | tee -a "$LOGFILE"

# ── 6. Fail2ban Tuning ───────────────────────────────────────────────────────
echo "[*] Tuning fail2ban..."

cat > /etc/fail2ban/jail.d/luminify.conf << 'EOF'
[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
findtime = 300
bantime  = 3600
ignoreip = 127.0.0.1/8

[nginx-http-auth]
enabled  = true
port     = http,https
filter   = nginx-http-auth
logpath  = /var/log/nginx/*.error.log
maxretry = 5
bantime  = 600

[nginx-botsearch]
enabled  = true
port     = http,https
filter   = nginx-botsearch
logpath  = /var/log/nginx/*.access.log
maxretry = 2
bantime  = 86400
EOF

systemctl restart fail2ban
echo "OK: fail2ban tuned" | tee -a "$LOGFILE"

# ── 7. Automatic Security Updates ────────────────────────────────────────────
echo "[*] Enabling unattended security upgrades..."

apt-get install -y unattended-upgrades 2>/dev/null

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

systemctl enable unattended-upgrades
systemctl restart unattended-upgrades
echo "OK: Auto security updates enabled" | tee -a "$LOGFILE"

# ── 8. File Permissions Audit ────────────────────────────────────────────────
echo "[*] Hardening file permissions..."

# .env files
find /opt/luminify -name ".env*" -exec chmod 600 {} \; 2>/dev/null || true
chmod 700 /opt/luminify 2>/dev/null || true

# SSH authorized_keys
chmod 700 /root/.ssh 2>/dev/null || true
chmod 600 /root/.ssh/authorized_keys 2>/dev/null || true

echo "OK: File permissions hardened" | tee -a "$LOGFILE"

# ── 9. Final Audit Output ────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  SECURITY HARDENING COMPLETE"
echo "════════════════════════════════════════════════"
echo ""
echo "[CHECK] SSH settings:"
sshd -T 2>/dev/null | grep -E 'passwordauth|x11forward|maxauthtries|logingraceime|permitrootlogin'

echo ""
echo "[CHECK] Listening ports:"
ss -tlnp | grep -v '127.0.0.1'

echo ""
echo "[CHECK] UFW status:"
ufw status

echo ""
echo "[CHECK] Fail2ban status:"
fail2ban-client status

echo ""
echo "[CHECK] Disabled services:"
for svc in ModemManager udisks2 apport avahi-daemon; do
  echo "  $svc: $(systemctl is-enabled $svc 2>/dev/null || echo not-found)"
done

echo ""
echo "Full log: $LOGFILE"
