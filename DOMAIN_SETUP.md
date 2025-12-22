# Domain Setup Guide for resonancedb.aiqra.ai

## ✅ What's Already Done

1. **Traefik** deployed on EC2 (44.211.73.228)
2. **API** and **Frontend** containers running
3. **SSL Configuration** ready (Let's Encrypt via Traefik)
4. All containers configured with domain labels

---

## 📋 DNS Records to Add

Go to your DNS provider (wherever you manage `aiqra.ai` domain) and add these **A records**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `resonancedb` | `44.211.73.228` | 300 |
| **A** | `www.resonancedb` | `44.211.73.228` | 300 |
| **A** | `api.resonancedb` | `44.211.73.228` | 300 |

### Example (if using Route 53, Cloudflare, etc.):
```
resonancedb.aiqra.ai        A    44.211.73.228
www.resonancedb.aiqra.ai    A    44.211.73.228
api.resonancedb.aiqra.ai    A    44.211.73.228
```

---

## ⏱️ Wait for DNS Propagation

After adding the DNS records, wait **5-15 minutes** for DNS to propagate.

**Check DNS propagation:**
```bash
nslookup resonancedb.aiqra.ai
nslookup api.resonancedb.aiqra.ai
```

Or use online tools:
- https://dnschecker.org/#A/resonancedb.aiqra.ai

---

## 🔄 Restart Traefik (After DNS is Ready)

Once DNS is propagating, restart Traefik to trigger SSL certificate generation:

```bash
ssh -i "resonancedb-key.pem" ec2-user@44.211.73.228
cd resonancedb-web
docker compose -f docker-compose.ec2-prod.yml restart traefik
docker logs -f resonancedb-traefik
```

Look for log messages like:
```
"Successfully obtained certificate for resonancedb.aiqra.ai"
```

---

## ✨ Final URLs

Once DNS is live and SSL certificates are issued:

| Service | URL |
|---------|-----|
| **Frontend** | https://resonancedb.aiqra.ai |
| **Frontend (www)** | https://www.resonancedb.aiqra.ai |
| **API** | https://api.resonancedb.aiqra.ai |
| **API Docs** | https://api.resonancedb.aiqra.ai/docs |

All HTTP traffic will automatically redirect to HTTPS!

---

## 🔧 Troubleshooting

### Check Container Status
```bash
ssh -i "resonancedb-key.pem" ec2-user@44.211.73.228
docker ps
```

### View Traefik Logs
```bash
docker logs resonancedb-traefik
```

### Check SSL Certificate Status
```bash
docker exec resonancedb-traefik cat /letsencrypt/acme.json
```

### Restart All Services
```bash
cd resonancedb-web
docker compose -f docker-compose.ec2-prod.yml down
docker compose -f docker-compose.ec2-prod.yml up -d
```
