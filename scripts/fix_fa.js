const fs = require('fs');
const path = require('path');

const dir = 'd:/Sunshine-fancy-costume/public';
const targetLink = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">';

const patterns = [
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer">',
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />'
];

function walk(directory) {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            walk(filePath);
        } else if (filePath.endsWith('.html')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let changed = false;
            patterns.forEach(p => {
                if (content.includes(p)) {
                    content = content.split(p).join(targetLink);
                    changed = true;
                }
            });
            if (changed) {
                fs.writeFileSync(filePath, content);
                console.log(`Updated: ${filePath}`);
            }
        }
    });
}

walk(dir);
console.log('Finished global update.');
