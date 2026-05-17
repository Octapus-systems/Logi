const fs = require('fs');
const path = require('path');

function stripJsDoc(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      stripJsDoc(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      console.log(`Stripping JSDoc from: ${fullPath}`);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove JSDoc comments: /** ... */
      content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

stripJsDoc('app/api');
