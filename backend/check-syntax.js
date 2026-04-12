const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function check(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            check(p);
        } else if (p.endsWith('.js')) {
            try {
                execSync(`node --check "${p}"`);
            } catch (e) {
                console.log(`Error in: ${p}`);
            }
        }
    });
}
check('src');
console.log('Done checking syntax.');
