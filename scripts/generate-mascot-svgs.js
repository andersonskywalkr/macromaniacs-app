const fs = require('fs');
const path = require('path');

function escapeForTemplateLiteral(svg) {
  return svg
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

const root = path.join(__dirname, '..');
const login = fs.readFileSync(path.join(root, 'assets/mascote/login.svg'), 'utf8').trim();
const maintenance = fs
  .readFileSync(path.join(root, 'assets/mascote/maintenance.svg'), 'utf8')
  .trim();

const header = [
  '// Gerado a partir de assets/mascote/*.svg (rode scripts/generate-mascot-svgs.js',
  '// de novo se os arquivos originais mudarem) — conteúdo bruto embutido como',
  '// string, mesma técnica de FireIcon/MedalIcon em components/icons.tsx, em vez',
  '// de referenciar o arquivo por URI. SvgUri + require() funcionava no Expo',
  '// Go/dev (o Metro serve o asset por HTTP), mas quebra numa build nativa de',
  '// produção: no Android o asset vira um recurso embutido no APK',
  '// (file:///android_res/...), que fetch() não consegue ler. String inline via',
  '// SvgXml não depende de resolver asset nenhum, então funciona igual em dev e',
  '// em produção.',
  '',
].join('\n');

const loginConst = `export const LOGIN_MASCOT_XML = \`${escapeForTemplateLiteral(login)}\`;\n`;
const maintenanceConst = `export const MAINTENANCE_MASCOT_XML = \`${escapeForTemplateLiteral(maintenance)}\`;\n`;

const outPath = path.join(root, 'src/components/mascotSvgs.ts');
fs.writeFileSync(outPath, header + loginConst + '\n' + maintenanceConst);
console.log('wrote', fs.statSync(outPath).size, 'bytes to', outPath);
