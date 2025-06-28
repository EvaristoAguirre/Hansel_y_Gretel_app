require('tsconfig-paths/register');

console.log('baseUrl and paths resolved:');
const tsConfigPaths = require('tsconfig-paths');
const configLoader = tsConfigPaths.loadConfig();
console.log(configLoader);

try {
  const resolved = require.resolve('src/Product/product.repository');
  console.log('Resolved path:', resolved);
} catch (error) {
  console.error('Error resolving path:', error);
}
