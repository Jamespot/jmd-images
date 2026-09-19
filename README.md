# jmd-images — la bibliothèque d'images Jamespot pour JMD

Des fichiers image, un index `images.yaml`, rien d'autre. Pas de service, pas de base : le repo **est** la bibliothèque. Un deck `.jmd` nomme une image par son slug, le build de JMD vient chercher le fichier ici et l'embarque dans le HTML livré.

```markdown
![Boîte de réception Cortex](img:jamespot/cortex-inbox-liste){.right}
```

Côté JMD, le `brand.yaml` déclare ce repo une fois pour toutes, servi par GitHub Pages (CDN, 1 Go) :

```yaml
images:
  jamespot: https://jamespot.github.io/jmd-images/
```

Pas jsDelivr : il refuse la racine d'un dépôt de plus de 50 Mo, et une bibliothèque de photos dépasse ça vite.

Le résolveur `img:` côté JMD est le chantier suivant (voir le plan de vol de JMD). Ce repo n'attend pas : il se remplit dès maintenant, l'index est le contrat.

## Ajouter des images : le skill fait le travail

Déposer les fichiers dans `inbox/` (jamais commité), ouvrir Claude Code dans ce repo et dire « ajoute ces images ». Le skill [`add-images`](.claude/skills/add-images/SKILL.md) regarde chaque image, choisit le dossier et le slug, optimise le fichier, écrit la légende et les tags, vérifie, commit. Une ligne de validation et c'est publié.

## Le contrat

### Les dossiers

| Dossier | `kind` | Ce qu'on y met |
|---|---|---|
| `produit/` | `capture` | captures d'écran de Jamespot, de ses modules, de ses apps |
| `illustrations/` | `illustration` | illustrations vectorielles ou bitmap, packs métier, concepts |
| `photos/` | `photo` | photos : équipe, événements, clients, ambiances |
| `logos/` | `logo` | marques Jamespot, badges, certifications, logos partenaires autorisés |
| `schemas/` | `schema` | schémas d'architecture, de fonctionnement, de process |
| `inbox/` | | la zone de dépôt, ignorée par git |

Le fichier s'appelle comme son slug : `produit/cortex-inbox-liste.png`.

### L'index `images.yaml`

Une liste, une entrée par image :

```yaml
- slug: cortex-inbox-liste              # identifiant stable, minuscules et tirets, immuable
  file: produit/cortex-inbox-liste.png  # dossier/slug.ext
  caption: Boîte de réception de Cortex en vue liste, thème clair, trois conversations non lues
  tags: [cortex, inbox, capture, messagerie]
  kind: capture                         # capture | illustration | photo | logo | schema
  fit: [right, wide]                    # placements JMD où l'image rend bien : cover | right | wide | inline
  focal: [0.3, 0.5]                     # optionnel : point de recadrage pour .cover, [x, y] entre 0 et 1
  status: approved                      # approved | draft | retired — seul approved sort par défaut
  source: jamespot                      # jamespot | unsplash:<id> | generated | nom de l'auteur
  credit: Photo de … sur Unsplash       # obligatoire quand source est unsplash:…
  added: 2026-09-19
  origin: https://jamespot.com/blog/…      # optionnel : la page d'où vient l'image, son contexte
  recolor: true                         # SVG seulement, plus tard : repeint avec la palette du brand
```

La **légende** est ce qu'on cherche : une phrase en français qui dit ce qu'on voit, avec les noms de produits tels que Jamespot les nomme. Les tags complètent avec des mots que la phrase ne contient pas.

### Les fichiers

| Nature | Format | Taille |
|---|---|---|
| capture avec du texte | PNG, ou JPEG qualité 90 si le PNG dépasse 800 Ko | côté long 2560 px max, viser moins de 800 Ko |
| photo | JPEG qualité 80 à 85 | côté long 1920 px, moins de 800 Ko |
| logo, illustration vectorielle | SVG sans script, sans référence externe, sans bitmap embarqué | |
| logo, illustration bitmap | PNG avec transparence | côté long 1600 px max |

Pas de WebP ni d'AVIF : la bibliothèque sert aussi hors de JMD (PowerPoint, Keynote, un fichier pris à la main), et là seuls JPEG, PNG et SVG passent partout. Dur : 2 Mo par fichier. Une slide JMD fait 1280 × 720 points, une image `.cover` est embarquée en data URI dans le HTML, un deck de dix images ne doit pas peser dix mégaoctets.

### Les règles qui ne bougent pas

- **Un slug ne change jamais.** Des decks le nomment. Remplacer l'image sous un slug est permis (même sujet, meilleure version), le renommer ne l'est pas.
- **Un fichier ne se supprime pas.** Une image qui ne doit plus servir passe en `status: retired` et reste là : les decks déjà construits l'embarquent, ceux qui la nomment encore la trouvent.
- **Rien de confidentiel.** Tout ce qui est ici est public dès le push. Une capture avec de vrais noms, e-mails, données client, ne rentre pas.
- **Tout fichier a son entrée.** `npm run check` refuse un fichier orphelin et une entrée sans fichier.

### Vérifier

```bash
npm install          # une fois
npm run check        # l'index, les fichiers, les tailles, les orphelins, l'inbox en attente
```

La CI lance la même commande sur chaque push et chaque PR.

## Licence

Deux licences, dans [LICENSE.md](LICENSE.md) : le code et le format sont sous **MIT**, à copier pour sa propre bibliothèque ; les images sont sous la **Jamespot Image Usage License**, libres dans tout document produit avec JMD, pas redistribuables telles quelles. Les logos restent des marques, les photos Unsplash gardent leur crédit. Contact : info@jamespot.com.
