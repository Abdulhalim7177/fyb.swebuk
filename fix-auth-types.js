const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Skip certain directories
      if (file === 'node_modules' || file === '.next' || file === '.git') {
        return;
      }
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      // Only process .ts and .tsx files
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(__dirname);
let totalFixed = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Replace .auth.getUser() with (variable.auth as any).getUser()
    if (content.includes('.auth.getUser()')) {
      content = content.replace(/(\w+)\.auth\.getUser\(\)/g, '($1.auth as any).getUser()');
      modified = true;
    }

    // Replace .auth.getSession() with (variable.auth as any).getSession()
    if (content.includes('.auth.getSession()')) {
      content = content.replace(/(\w+)\.auth\.getSession\(\)/g, '($1.auth as any).getSession()');
      modified = true;
    }

    // Replace .auth.signOut() with (variable.auth as any).signOut()
    if (content.includes('.auth.signOut()')) {
      content = content.replace(/(\w+)\.auth\.signOut\(\)/g, '($1.auth as any).signOut()');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${path.relative(__dirname, file)}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);
