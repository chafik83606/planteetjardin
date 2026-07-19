# Captures Play Store / App Store

## Usage

1. Déposez vos images (n’importe quelle taille) dans `input/`
2. Lancez :

```powershell
npm run screenshots:resize
```

3. Récupérez les fichiers prêts dans `output/` (1080×1920)
4. Uploadez-les dans Play Console → **Captures d'écran téléphone**

## Modes

| Commande | Effet |
|----------|--------|
| `npm run screenshots:resize` | **cover** — remplit le cadre, recadre le surplus (défaut) |
| `npm run screenshots:resize:pad` | **contain** — garde toute l’image, bandes vertes autour |

## iPhone App Store (optionnel)

```powershell
python scripts/resize_screenshots.py --width 1290 --height 2796
```
