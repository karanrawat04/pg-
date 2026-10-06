const fs = require('fs');
const path = require('path');

const rnPkgPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'package.json');
const polyfillPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'rn-get-polyfills.js');

const polyfillContent = `'use strict';

module.exports = function getPolyfills() {
  try {
    return [
      require.resolve('@react-native/js-polyfills/console.js'),
      require.resolve('@react-native/js-polyfills/error-guard.js'),
    ];
  } catch (e) {
    return [];
  }
};
`;

try {
  // 1. Ensure rn-get-polyfills.js exists with full polyfills
  fs.writeFileSync(polyfillPath, polyfillContent);
  console.log('[patch-rn] Verified rn-get-polyfills.js with ErrorUtils & console polyfills');

  // 2. Ensure exports include rn-get-polyfills and feature flags
  if (fs.existsSync(rnPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(rnPkgPath, 'utf8'));
    let changed = false;

    if (pkg.exports) {
      if (!pkg.exports['./rn-get-polyfills']) {
        pkg.exports['./rn-get-polyfills'] = './rn-get-polyfills.js';
        changed = true;
      }
      if (!pkg.exports['./src/private/featureflags/ReactNativeFeatureFlags']) {
        pkg.exports['./src/private/featureflags/ReactNativeFeatureFlags'] = './src/private/featureflags/ReactNativeFeatureFlags.js';
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(rnPkgPath, JSON.stringify(pkg, null, 2));
        console.log('[patch-rn] Patched react-native package.json exports');
      }
    }
  }
} catch (err) {
  // Ignore errors if node_modules not yet present
}
