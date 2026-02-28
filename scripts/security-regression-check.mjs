import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const read = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

const checks = [
  {
    name: 'Preview modal no longer uses v-html',
    pass: () => !/v-html=/.test(read('src/components/layout/PreviewModal.vue'))
  },
  {
    name: 'Print pipeline removed raw HTML string injection',
    pass: () => !/innerHTML\s*=\s*content/.test(read('src/utils/print.ts'))
  },
  {
    name: 'Remote auth token legacy key is actively cleared from localStorage',
    pass: () => /localStorage\.removeItem\('print-designer-remote-auth-token'\)/.test(read('src/composables/usePrintSettings.ts'))
  },
  {
    name: 'Remote auth token is never written to localStorage',
    pass: () => !/localStorage\.setItem\([^)]*remote-auth-token/.test(read('src/composables/usePrintSettings.ts'))
  },
  {
    name: 'Remote password is excluded from persisted remote settings',
    pass: () => /sanitizeRemoteSettingsForStorage/.test(read('src/composables/usePrintSettings.ts'))
      && !/password:\s*value\.password/.test(read('src/composables/usePrintSettings.ts'))
  },
  {
    name: 'Legacy custom script execution is policy-gated in table rendering',
    pass: () => /isLegacyCustomScriptAllowed/.test(read('src/components/elements/TableElement.vue'))
  },
  {
    name: 'Legacy custom script execution is policy-gated in print pipeline',
    pass: () => /isLegacyCustomScriptAllowed/.test(read('src/utils/print.ts'))
  },
  {
    name: 'Remote WebSocket security enforcement requires wss for non-localhost',
    pass: () => /assertSecureRemoteWsUrl/.test(read('src/composables/usePrintSettings.ts'))
      && /assertSecureRemoteWsUrl/.test(read('src/utils/print.ts'))
  },
  {
    name: 'WebSocket query auth is disabled by default and must be explicitly enabled',
    pass: () => /if \(!getSecurityPolicy\(\)\.allowLegacyWsQueryAuth\) return base;/.test(read('src/composables/usePrintSettings.ts'))
  },
  {
    name: 'Remote auth uses post-connect auth message instead of query token by default',
    pass: () => /socket\.send\(JSON\.stringify\(\{ cmd: 'auth', token: remoteAuthToken\.value\.trim\(\) \}\)\)/.test(read('src/composables/usePrintSettings.ts'))
      && /sendWsPrintOnce\(remoteWsUrl\.value,\s*payload,\s*'task_result',\s*\{ cmd: 'auth', token: remoteToken \}\)/.test(read('src/utils/print.ts'))
  },
  {
    name: 'Local auth uses post-connect auth message instead of query key by default',
    pass: () => /socket\.send\(JSON\.stringify\(\{ type: 'auth', key: localSettings\.secretKey\.trim\(\) \}\)\)/.test(read('src/composables/usePrintSettings.ts'))
      && /sendLocalWsPrint\(localWsUrl\.value,\s*payload,\s*'status',\s*authMessage\)/.test(read('src/utils/print.ts'))
  },
  {
    name: 'Web component exposes setSecurityPolicy API',
    pass: () => /setSecurityPolicy\(policy: Partial<SecurityPolicy>\)/.test(read('src/web-component.ts'))
  },
  {
    name: 'Web component error scope can emit security',
    pass: () => /scope = isSecurityPolicyError\(error\) \? 'security'/.test(read('src/web-component.ts'))
  }
];

const failed = checks.filter((check) => !check.pass());

if (failed.length > 0) {
  console.error('Security regression check failed:');
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log(`Security regression check passed (${checks.length} checks).`);
