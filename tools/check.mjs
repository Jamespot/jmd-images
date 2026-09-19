#!/usr/bin/env node
// Vérifie images.yaml et les dossiers : le contrat du README, rendu exécutable.
// Sortie : une ligne par constat, `error` ou `warn`, exit 1 s'il y a au moins une erreur.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FOLDERS = ['produit', 'illustrations', 'photos', 'logos', 'schemas'];
const EXT = ['.png', '.jpg', '.jpeg', '.svg']; // pas de webp/avif : la bibliothèque sert aussi hors navigateur
const KIND = ['capture', 'illustration', 'photo', 'logo', 'schema'];
const FIT = ['cover', 'right', 'wide', 'inline'];
const STATUS = ['approved', 'draft', 'retired'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WARN_BYTES = 800 * 1024, MAX_BYTES = 2 * 1024 * 1024;

const findings = [];
const error = (where, message) => findings.push({ level: 'error', where, message });
const warn = (where, message) => findings.push({ level: 'warn', where, message });

let entries;
try { entries = parse(readFileSync(join(root, 'images.yaml'), 'utf8')); }
catch (e) { error('images.yaml', 'YAML invalide : ' + e.message); report(); }
if (entries === null || entries === undefined) entries = [];
if (!Array.isArray(entries)) { error('images.yaml', 'la racine doit être une liste d\'entrées'); report(); }

const slugs = new Set(), files = new Set();
entries.forEach((e, i) => {
  const at = `images.yaml #${i + 1}` + (e && e.slug ? ` (${e.slug})` : '');
  if (!e || typeof e !== 'object') return error(at, 'entrée vide ou mal formée');
  // slug
  if (typeof e.slug !== 'string' || !SLUG.test(e.slug)) error(at, 'slug manquant ou invalide : minuscules, chiffres, tirets (ex. cortex-inbox-liste)');
  else if (e.slug.length > 60) error(at, 'slug trop long (60 max)');
  else if (slugs.has(e.slug)) error(at, 'slug en double');
  else slugs.add(e.slug);
  // file
  if (typeof e.file !== 'string') error(at, 'file manquant');
  else {
    const folder = e.file.split('/')[0];
    if (!FOLDERS.includes(folder)) error(at, `file doit être dans un des dossiers ${FOLDERS.join(', ')}`);
    if (!EXT.includes(extname(e.file).toLowerCase())) error(at, `extension inattendue (${EXT.join(', ')})`);
    const p = join(root, e.file);
    if (!existsSync(p)) error(at, `fichier introuvable : ${e.file}`);
    else {
      files.add(e.file);
      const size = statSync(p).size;
      if (size > MAX_BYTES) error(at, `fichier trop lourd : ${(size / 1024).toFixed(0)} Ko (2 Mo max)`);
      else if (size > WARN_BYTES) warn(at, `fichier lourd : ${(size / 1024).toFixed(0)} Ko (viser 800 Ko)`);
      if (extname(e.file).toLowerCase() === '.svg') {
        const svg = readFileSync(p, 'utf8');
        if (/<script/i.test(svg)) error(at, 'SVG avec <script>');
        if (/href=["']https?:/i.test(svg)) error(at, 'SVG avec une référence externe');
        if (/data:image\/(png|jpe?g|webp)/i.test(svg)) warn(at, 'SVG avec une image bitmap embarquée : un PNG serait plus honnête');
      }
    }
    if (typeof e.slug === 'string' && e.file && !e.file.includes('/' + e.slug + '.')) error(at, 'le nom du fichier doit être le slug (dossier/slug.ext)');
  }
  // caption, tags, kind, fit, status
  if (typeof e.caption !== 'string' || e.caption.trim().length < 10) error(at, 'caption manquante ou trop courte (une phrase qui dit ce qu\'on voit)');
  if (!Array.isArray(e.tags) || !e.tags.length || !e.tags.every(t => typeof t === 'string')) error(at, 'tags : une liste d\'au moins un mot');
  if (!KIND.includes(e.kind)) error(at, `kind doit être un de ${KIND.join(', ')}`);
  if (!Array.isArray(e.fit) || !e.fit.length || !e.fit.every(f => FIT.includes(f))) error(at, `fit : une liste parmi ${FIT.join(', ')}`);
  if (!STATUS.includes(e.status)) error(at, `status doit être un de ${STATUS.join(', ')}`);
  if (e.focal !== undefined && !(Array.isArray(e.focal) && e.focal.length === 2 && e.focal.every(n => typeof n === 'number' && n >= 0 && n <= 1))) error(at, 'focal : [x, y] entre 0 et 1');
  if (typeof e.source !== 'string' || !e.source) error(at, 'source manquante (jamespot, unsplash:<id>, generated, ou l\'auteur)');
  else if (/^unsplash:/.test(e.source) && !e.credit) error(at, 'une image Unsplash porte un credit');
  if (e.origin !== undefined && !(typeof e.origin === 'string' && /^https:\/\//.test(e.origin))) error(at, 'origin : une URL https (la page d\'où vient l\'image)');
  if (typeof e.added !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.added)) error(at, 'added : une date AAAA-MM-JJ');
  if (e.kind && e.file) {
    const expect = { capture: 'produit', illustration: 'illustrations', photo: 'photos', logo: 'logos', schema: 'schemas' }[e.kind];
    if (expect && e.file.split('/')[0] !== expect) warn(at, `kind ${e.kind} attendu dans ${expect}/`);
  }
});

// Orphelins : un fichier dans un dossier de la bibliothèque sans entrée dans l'index.
for (const folder of FOLDERS) {
  const dir = join(root, folder);
  if (!existsSync(dir)) { error(folder, 'dossier manquant'); continue; }
  for (const f of readdirSync(dir)) {
    if (f.startsWith('.')) continue;
    const rel = folder + '/' + f;
    if (!files.has(rel)) error(rel, 'fichier sans entrée dans images.yaml');
  }
}
// La zone de dépôt n'est pas la bibliothèque : ce qui y traîne est du travail en attente.
const pending = existsSync(join(root, 'inbox')) ? readdirSync(join(root, 'inbox')).filter(f => !f.startsWith('.')) : [];
if (pending.length) warn('inbox/', `${pending.length} fichier(s) à traiter : ${pending.join(', ')}`);

report();

function report() {
  const errors = findings.filter(f => f.level === 'error').length, warns = findings.length - errors;
  for (const f of findings) console.log(`${f.level.padEnd(5)} ${f.where} — ${f.message}`);
  console.log(`${entries ? entries.length : 0} image(s) indexée(s), ${errors} erreur(s), ${warns} avertissement(s)`);
  process.exit(errors ? 1 : 0);
}
