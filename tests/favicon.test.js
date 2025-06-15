const fs = require('fs');
const path = require('path');

describe('Favicon Tests', () => {
    test('favicon.ico file should exist in public directory', () => {
        const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
        expect(fs.existsSync(faviconPath)).toBe(true);
    });

    test('favicon.ico file should not be empty', () => {
        const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
        const stats = fs.statSync(faviconPath);
        expect(stats.size).toBeGreaterThan(0);
    });

    test('favicon.ico file should be a valid ICO format', () => {
        const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
        const buffer = fs.readFileSync(faviconPath);
        
        expect(buffer[0]).toBe(0x00);
        expect(buffer[1]).toBe(0x00);
        expect(buffer[2]).toBe(0x01);
        expect(buffer[3]).toBe(0x00);
    });

    test('favicon.svg file should exist as fallback', () => {
        const faviconSvgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
        expect(fs.existsSync(faviconSvgPath)).toBe(true);
    });

    test('favicon.svg should contain battleship-themed content', () => {
        const faviconSvgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
        const svgContent = fs.readFileSync(faviconSvgPath, 'utf8');
        
        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('</svg>');
        expect(svgContent.toLowerCase()).toMatch(/ship|hull|mast|flag|cannon/);
    });
});
