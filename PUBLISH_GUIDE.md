# @freecustom/email SDK — npm Publish Guide
# ─────────────────────────────────────────────────────────────────────────────

══════════════════════════════════════════════════════════════
FILE STRUCTURE
══════════════════════════════════════════════════════════════

@freecustom/email/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── LICENSE              ← create this (MIT)
└── src/
    ├── index.ts         ← public exports
    ├── client.ts        ← FreecustomEmailClient
    ├── http.ts          ← HTTP client with retry/timeout
    ├── ws-client.ts     ← WebSocket client
    ├── types.ts         ← all TypeScript types
    ├── errors.ts        ← typed error classes
    └── resources/
        ├── inboxes.ts
        ├── messages.ts
        ├── otp.ts
        ├── domains.ts
        ├── webhooks.ts
        └── account.ts

══════════════════════════════════════════════════════════════
STEP 1 — SETUP
══════════════════════════════════════════════════════════════

node --version    # must be >= 18
npm --version     # must be >= 9

cd sdk
npm install

# This installs: tsup, typescript, vitest, @types/node, @types/ws, ws

══════════════════════════════════════════════════════════════
STEP 2 — CREATE LICENSE FILE
══════════════════════════════════════════════════════════════

Create LICENSE file in root:

  MIT License
  Copyright (c) 2026 FreeCustom.Email
  Permission is hereby granted, free of charge, to any person obtaining a copy...
  [full MIT license text]

══════════════════════════════════════════════════════════════
STEP 3 — BUILD
══════════════════════════════════════════════════════════════

npm run build

# tsup builds two formats simultaneously:
#   dist/index.js    ← ESM  (import { FreecustomEmailClient } from '@freecustom/email')
#   dist/index.cjs   ← CJS  (const { FreecustomEmailClient } = require('@freecustom/email'))
#   dist/index.d.ts  ← TypeScript declarations

# Verify dist/ exists and has all three files before publishing

══════════════════════════════════════════════════════════════
STEP 4 — TYPE CHECK
══════════════════════════════════════════════════════════════

npm run typecheck

# Runs tsc --noEmit — catches all type errors without emitting files
# Fix all errors before publishing

══════════════════════════════════════════════════════════════
STEP 5 — TEST LOCALLY BEFORE PUBLISHING
══════════════════════════════════════════════════════════════

# In a separate test project:
npm pack    # creates freecustom-email-1.0.0.tgz

cd /tmp
mkdir test-sdk && cd test-sdk
npm init -y
npm install /path/to/sdk/freecustom-email-1.0.0.tgz

# Create test.mjs:
cat > test.mjs << 'EOF'
import { FreecustomEmailClient } from '@freecustom/email';

const client = new FreecustomEmailClient({
  apiKey: 'fce_your_real_key',
});

const info = await client.account.info();
console.log('Plan:', info.plan);
console.log('Credits:', info.credits);

const inboxes = await client.inboxes.list();
console.log('Inboxes:', inboxes);
EOF

node test.mjs
# Should print your plan and inbox list

══════════════════════════════════════════════════════════════
STEP 6 — CREATE npm ORGANISATION (one-time)
══════════════════════════════════════════════════════════════

# You need an npm org for scoped packages like @freecustom/email
# Go to: https://www.npmjs.com/org/create
# Org name: freecustom
# This lets you publish under @freecustom/...

# Or if you already have an account, create via CLI:
npm org create freecustom

══════════════════════════════════════════════════════════════
STEP 7 — LOGIN TO npm
══════════════════════════════════════════════════════════════

npm login
# Enter your npm username, password, email, and 2FA code

# Verify you're logged in:
npm whoami

══════════════════════════════════════════════════════════════
STEP 8 — DRY RUN (see exactly what gets published)
══════════════════════════════════════════════════════════════

npm publish --dry-run

# Should show only:
#   dist/index.js
#   dist/index.cjs
#   dist/index.d.ts
#   dist/index.js.map
#   dist/index.cjs.map
#   dist/index.d.ts.map
#   README.md
#   LICENSE
#   package.json

# If node_modules or src/ appear, check the "files" field in package.json

══════════════════════════════════════════════════════════════
STEP 9 — PUBLISH
══════════════════════════════════════════════════════════════

# First publish — scoped packages are private by default
# Use --access public to make it free to install
npm publish --access public

# Output:
#   npm notice Publishing to https://registry.npmjs.org/
#   + @freecustom/email@1.0.0

# Verify it's live:
npm info @freecustom/email

══════════════════════════════════════════════════════════════
STEP 10 — PUBLISHING UPDATES
══════════════════════════════════════════════════════════════

# Patch (bug fix): 1.0.0 → 1.0.1
npm version patch
npm publish --access public

# Minor (new feature, backwards compatible): 1.0.0 → 1.1.0
npm version minor
npm publish --access public

# Major (breaking change): 1.0.0 → 2.0.0
npm version major
npm publish --access public

# npm version automatically:
#   1. Bumps version in package.json
#   2. Creates a git commit
#   3. Creates a git tag

══════════════════════════════════════════════════════════════
STEP 11 — POST-PUBLISH CHECKLIST
══════════════════════════════════════════════════════════════

□ Package visible at: https://www.npmjs.com/package/@freecustom/email
□ README renders correctly on npm page
□ Types work: npm install @freecustom/email && tsc in a test project
□ ESM works: import { FreecustomEmailClient } from '@freecustom/email'
□ CJS works: const { FreecustomEmailClient } = require('@freecustom/email')
□ Add install badge to your docs:
    [![npm](https://img.shields.io/npm/v/@freecustom/email)](https://www.npmjs.com/package/@freecustom/email)

══════════════════════════════════════════════════════════════
STEP 12 — ADD TO YOUR DOCS
══════════════════════════════════════════════════════════════

Update freecustom.email/docs/api to include SDK installation:

  npm install @freecustom/email

And link to the README/npm page. This is the primary discovery
path for developers who land on your docs.

══════════════════════════════════════════════════════════════
TROUBLESHOOTING
══════════════════════════════════════════════════════════════

ERROR: "You must be logged in to publish packages"
→ Run: npm login

ERROR: "Package name too similar to existing package"
→ Your package name is unique — @freecustom/email should be fine

ERROR: "403 Forbidden — org does not exist"
→ Create the npm org first: https://www.npmjs.com/org/create

ERROR: ESM import fails in Node.js
→ Make sure your consumer package.json has "type": "module"
   OR use the .cjs build: require('@freecustom/email')

ERROR: "Cannot find module ws"
→ ws is a peer dependency for Node.js. Run: npm install ws
→ In browsers, native WebSocket is used automatically — ws not needed

ERROR: TypeScript "cannot find type declarations"
→ Make sure dist/index.d.ts exists after build
→ Check package.json "types" field points to dist/index.d.ts
