# AlgoViz — Interactive ML Algorithm Visualizer

Dark, modern web app for **playing with**, **sharing**, and **learning** ML algorithms.

## Algorithms

| # | Algorithm | Highlights |
|---|-----------|------------|
| 1 | **Gradient Descent** | 3D loss · GD / Momentum / Adam · auto-orbit |
| 2 | **Attention** | Multi-head heatmap · arcs · causal mask |
| 3 | **Random Forest** | Bootstrap · Gini growth · ensemble votes |
| 4 | **K-Means** | k-means++ · centroid animation · inertia |

## Visual

- **Themes:** Midnight · Neon · Aurora (`T` or toolbar)
- **Ambient particles** that recolor per algorithm
- **Confetti** on converge / forest complete / clusters settle
- **Auto-orbit** camera while GD is playing (`O`)
- **Smooth** algorithm transitions + film grain

## Share

- Live **URL sync** of algorithm + params
- **Share** — copy deep link
- **Embed** — copy iframe HTML for Notion / blogs
- **Embed view** — minimal chrome (`?embed=1`)
- **Export PNG** of the stage
- Code-split bundles (lazy-loaded algorithms)

```
/?algo=gd&surface=himmelblau&opt=adam&lr=0.01
/?algo=attn&ex=cat&mask=causal&theme=neon
/?algo=km&k=5&embed=1&diff=beginner
```

## Learn

- **Learning panel** (`L`) with steps + “watch for”
- **Difficulty:** Beginner · Curious · Nerd (`D`)
- **Glossary** chips (gradient, softmax, Gini, inertia…)
- Tips scale with difficulty; nerd mode leans on formulas

## Play

- Sidebar **Playground** presets (auto-play)
- Keyboard: `1–4` · `Space` · `P` · `?` for full list

## Run

```bash
cd ml-algorithm-visualizer
npm install
npm run dev
```
