---
name: add-images
description: Ajouter, remplacer ou retirer des images dans la bibliothèque JMD de Jamespot (ce repo). Alain dépose des fichiers dans inbox/ ou donne leurs chemins, Claude fait tout le reste — regarde chaque image, choisit le dossier et le slug, optimise le fichier, écrit la légende et les tags dans images.yaml, vérifie, commit et pousse. À utiliser dès qu'il dit « ajoute ces images », « j'ai déposé des images », « indexe l'inbox », « remplace l'image X », « retire l'image X », ou « mets à jour la bibliothèque ».
---

# add-images — Alain dépose, Claude range

Ce repo est la bibliothèque d'images Jamespot pour JMD : des fichiers dans cinq dossiers et un index `images.yaml`. Le contrat complet est dans [README.md](../../../README.md) ; ce skill est la façon de le respecter sans qu'Alain ait à le relire. Le principe : **il dépose et dit un mot, tout le reste est ton travail**. Tu ne poses une question que quand l'image seule ne permet pas d'y répondre, et tu la poses en une ligne, après avoir fait tout ce qui ne dépend pas de la réponse.

## 0 · Trouver le travail

```bash
ls -la inbox/                 # ce qu'Alain a déposé
npm run check                 # l'état de l'index : orphelins, entrées cassées, inbox en attente
```

Le travail, c'est : les fichiers de `inbox/`, les chemins qu'Alain a donnés (ailleurs sur le disque, à copier dans `inbox/` d'abord), et les orphelins que `check` signale. Si `npm install` n'a jamais tourné, le lancer.

## 1 · Regarder chaque image

Ouvre chaque fichier avec l'outil Read : tu vois l'image. Ne jamais écrire une légende sans l'avoir regardée. De ce que tu vois, décide :

| Décision | Comment |
|---|---|
| `kind` et dossier | capture d'écran d'un produit → `capture`, `produit/` · dessin, illustration, pictos → `illustration`, `illustrations/` · photo → `photo`, `photos/` · marque, badge, certification → `logo`, `logos/` · schéma, diagramme → `schema`, `schemas/` |
| `slug` | `sujet-vue`, en minuscules et tirets, sans article : `cortex-inbox-liste`, `pack-rh-onboarding`, `logo-jamespot-blanc`, `equipe-seminaire-2026`. Court, lisible, unique (`grep slug: images.yaml`). Le nom du fichier déposé est un indice, pas une règle |
| `caption` | une phrase en français, 8 à 25 mots, qui dit **ce qu'on voit** : le produit, l'écran, l'action, le contexte. Les noms de produits comme Jamespot les nomme. C'est ce texte que les agents cherchent : « boîte de réception de Cortex en vue liste, trois conversations non lues » vaut mieux que « capture inbox » |
| `tags` | 3 à 8 mots que la légende ne contient pas déjà : synonymes, module, usage (`onboarding`, `rh`, `messagerie`, `mobile`) |
| `fit` | où l'image rend bien dans une slide : `right` (portrait ou carré, ou une capture qui supporte d'être coupée à droite), `cover` (paysage large, fond possible sous un titre), `wide` (pleine largeur), `inline` (petite, dans un cadre) |
| `focal` | seulement pour `cover` : le point à garder au recadrage, `[x, y]` entre 0 et 1, par exemple `[0.3, 0.5]` si le sujet est à gauche |
| `source` | `jamespot` pour tout ce qui vient de nous, `unsplash:<id>` plus `credit` pour une photo Unsplash, `generated` pour une image produite par un modèle, sinon le nom de l'auteur |

Ce que tu ne peux pas savoir en regardant, tu le demandes en une ligne à la fin, jamais avant d'avoir traité tout le reste : quel produit exactement quand l'écran est ambigu, si une photo a une autorisation, si une image est `draft` plutôt qu'`approved`. Par défaut, une image qu'Alain dépose est `approved` : c'est lui qui décide, et déposer, c'est décider.

**Confidentialité : tu es le garde-fou.** Une capture avec de vrais noms de personnes, des e-mails, des données d'un client identifiable, ne rentre pas. Tu le dis, tu laisses le fichier dans `inbox/`, tu continues avec les autres.

## 2 · Optimiser le fichier

Mesure d'abord : `sips -g pixelWidth -g pixelHeight -g format inbox/<f>` et `ls -l`. Puis applique la règle, avec les outils de la machine (`sips` est livré avec macOS, `cwebp` est installé) :

| Nature | Cible | Commande |
|---|---|---|
| capture avec du texte | PNG, côté long ≤ 2560 px | `sips -Z 2560 inbox/f.png --out produit/slug.png` |
| capture PNG > 800 Ko après resize | WebP q 90 | `cwebp -q 90 -metadata none inbox/f.png -o produit/slug.webp` |
| photo | WebP q 85, côté long ≤ 2560 px | `sips -Z 2560 inbox/f.jpg --out /tmp/f.jpg && cwebp -q 85 -metadata none /tmp/f.jpg -o photos/slug.webp` |
| logo ou illustration bitmap | PNG avec transparence, côté long ≤ 1600 px | `sips -Z 1600 inbox/f.png --out logos/slug.png` |
| SVG | tel quel, après lecture | vérifie à l'œil : pas de `<script>`, pas de `href="http`, pas de bitmap en `data:` ; sinon PNG |

Le fichier final s'appelle `dossier/slug.ext`. Le fichier déposé disparaît de `inbox/` une fois rangé (`rm`), jamais avant.

## 3 · Écrire l'entrée

Ajoute l'entrée à la fin de la liste dans `images.yaml`, dans l'ordre exact du contrat :

```yaml
- slug: cortex-inbox-liste
  file: produit/cortex-inbox-liste.png
  caption: Boîte de réception de Cortex en vue liste, thème clair, trois conversations non lues
  tags: [cortex, inbox, messagerie, capture]
  kind: capture
  fit: [right, wide]
  status: approved
  source: jamespot
  added: 2026-09-19
```

`focal` et `credit` seulement quand ils s'appliquent. Si l'index est vide (`[]`), remplace le `[]` par la première entrée.

## 4 · Vérifier

```bash
npm run check
```

Zéro erreur, sinon corrige et relance. Un avertissement de poids se règle en repassant par l'étape 2 avec WebP ou une taille plus petite.

## 5 · Récapituler, commiter, pousser

Montre à Alain un tableau : slug, dossier, légende, fit, poids. Puis :

```bash
git add images.yaml produit illustrations photos logos schemas
git commit -m "Images: <n> ajoutée(s) — <slug1>, <slug2>"
git push
```

Le push publie : c'est le but, le CDN sert `@main`. Tu ne pousses pas si tu as retenu un fichier pour confidentialité et qu'Alain n'a pas tranché, ni si `check` a des erreurs. Le message de commit dit ce qui est entré, pas comment.

## Remplacer ou retirer

- **Remplacer** (même sujet, meilleure version) : le slug reste, le fichier est écrasé sous le même nom (l'extension peut changer, alors `file` change), la légende est relue, et tu ajoutes `updated: AAAA-MM-JJ` sous `added`.
- **Retirer** : `status: retired`, rien d'autre. Le fichier reste, les decks qui le nomment le trouvent encore. Ne jamais `rm` un fichier indexé, ne jamais renommer un slug : des decks les nomment.

## Ce que tu ne fais jamais

- Écrire une légende sans avoir regardé l'image.
- Inventer un nom de produit : si tu ne sais pas, la légende décrit l'écran et tu demandes le nom en une ligne.
- Commiter `inbox/`, un fichier de plus de 2 Mo, ou un SVG avec du script.
- Pousser une image qui montre des données de personnes ou de clients.
