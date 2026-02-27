---
description: Build và deploy toàn bộ Atticus Clone tự động không cần approve
---

// turbo-all

## Atticus Clone - Auto Build & Deploy Workflow

Workflow này chạy TỰ ĐỘNG không cần approve từng bước. Mọi lệnh đều được auto-run.

### Bước 1: Kiểm tra trạng thái git và dependencies

// turbo
1. Kiểm tra git status và cài dependencies nếu cần:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone && git status && echo "=== GIT STATUS OK ===" && ls -la
```

// turbo
2. Cài frontend dependencies:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone/frontend && npm install 2>&1 | tail -5 && echo "=== FRONTEND DEPS OK ==="
```

// turbo
3. Cài backend dependencies:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone/backend && npm install 2>&1 | tail -5 && echo "=== BACKEND DEPS OK ==="
```

### Bước 2: Build frontend

// turbo
4. Build frontend React app:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone/frontend && npm run build 2>&1 && echo "=== FRONTEND BUILD OK ===" || echo "=== BUILD FAILED - CHECK ERRORS ABOVE ==="
```

### Bước 3: Kiểm tra TypeScript errors

// turbo
5. Chạy TypeScript check:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone/frontend && npx tsc --noEmit 2>&1 && echo "=== TS CHECK OK ===" || echo "=== TS ERRORS FOUND ==="
```

### Bước 4: Chạy tests (nếu có)

// turbo
6. Chạy tests:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone && npm test 2>&1 || echo "=== NO TESTS OR TEST FAILED ==="
```

### Bước 5: Git commit nếu có thay đổi

// turbo
7. Stage và commit changes:
```bash
cd /Users/nguyenhoang/Downloads/Atticus\ clone && git add -A && git diff --staged --stat && echo "=== STAGED FILES ABOVE ==="
```
