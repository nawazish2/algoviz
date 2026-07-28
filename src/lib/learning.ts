/**
 * Learning content: per-algorithm lessons, glossary, difficulty-aware tips.
 */
import type { AlgorithmId } from '../store/useVisualizerStore'

export type Difficulty = 'beginner' | 'curious' | 'nerd'

export interface GlossaryTerm {
  id: string
  term: string
  short: string
  beginner: string
  curious: string
  nerd: string
  related?: string[]
}

export interface LessonStep {
  title: string
  body: string
  tip?: string
  formula?: string
}

export interface AlgoLesson {
  algorithm: AlgorithmId
  title: string
  oneLiner: string
  intuition: string
  watchFor: string[]
  steps: LessonStep[]
  terms: string[] // glossary ids
  tryNext: string
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  gradient: {
    id: 'gradient',
    term: 'Gradient',
    short: 'Direction of steepest ascent',
    beginner:
      'Imagine standing on a hill: the gradient points uphill. Gradient descent walks the opposite way — downhill.',
    curious:
      '∇f is the vector of partial derivatives. We step θ ← θ − η∇f to reduce the loss.',
    nerd:
      'For f: ℝⁿ→ℝ, ∇f(θ) ∈ ℝⁿ. Under L-smoothness, step sizes η < 2/L guarantee descent for GD.',
    related: ['learning-rate', 'loss'],
  },
  'learning-rate': {
    id: 'learning-rate',
    term: 'Learning rate η',
    short: 'Step size of each update',
    beginner:
      'How big a step you take downhill. Too big → overshoot. Too small → snail pace.',
    curious:
      'η scales the gradient. Adaptive methods (Adam) effectively tune per-parameter step sizes.',
    nerd:
      'Line search / schedules (cosine, warmup) change η over time. Divergence often means η too large for local curvature.',
    related: ['gradient', 'adam'],
  },
  adam: {
    id: 'adam',
    term: 'Adam',
    short: 'Adaptive moment estimation',
    beginner:
      'A smarter walker: remembers recent direction (momentum) and adapts step size per dimension.',
    curious:
      'Tracks exponential moving averages of gradient (m) and squared gradient (v), bias-corrected.',
    nerd:
      'm̂_t = m_t/(1−β₁ᵗ), v̂_t = v_t/(1−β₂ᵗ), update −η m̂ / (√v̂ + ε). Default β₁=0.9, β₂=0.999.',
    related: ['gradient', 'learning-rate'],
  },
  loss: {
    id: 'loss',
    term: 'Loss surface',
    short: 'Error as a landscape',
    beginner:
      'Low valleys = good parameters. Training is finding a low point on this 3D “error mountain”.',
    curious:
      'Non-convex losses have many local minima and saddles — optimizers may settle differently.',
    nerd:
      'Test functions (Rosenbrock, Himmelblau) probe conditioning, multi-modality, and saddle behavior.',
    related: ['gradient'],
  },
  attention: {
    id: 'attention',
    term: 'Attention',
    short: 'Soft weighting over tokens',
    beginner:
      'Each word looks at other words and decides “how much should I care about each?”',
    curious:
      'Query asks, keys answer similarity, values carry content. Softmax turns scores into weights.',
    nerd:
      'Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V. Multi-head = H parallel subspaces, concatenated.',
    related: ['softmax', 'causal-mask', 'temperature'],
  },
  softmax: {
    id: 'softmax',
    term: 'Softmax',
    short: 'Scores → probabilities',
    beginner:
      'Turns any list of numbers into positive weights that sum to 1 — like percentages of attention.',
    curious:
      'exp(z_i) / Σ exp(z_j). Temperature T: softmax(z/T) — low T is peaky, high T is flat.',
    nerd:
      'Numerically stable form: subtract max(z). Gradient of cross-entropy+softmax is (p−y).',
    related: ['attention', 'temperature'],
  },
  temperature: {
    id: 'temperature',
    term: 'Temperature',
    short: 'Softmax sharpness',
    beginner:
      'Low temperature = decisive focus on one token. High = spreads attention evenly.',
    curious: 'Divide logits by T before softmax. T→0 approaches argmax; T→∞ approaches uniform.',
    nerd:
      'In sampling, T scales logits; in attention demos here it only affects the weight distribution.',
    related: ['softmax'],
  },
  'causal-mask': {
    id: 'causal-mask',
    term: 'Causal mask',
    short: 'No peeking at the future',
    beginner:
      'Like writing left-to-right: you can only look at words you’ve already written (GPT-style).',
    curious:
      'Upper triangle of attention scores set to −∞ so softmax weight is ~0 on future keys.',
    nerd:
      'Implements autoregressive factorization p(x_t | x_<t). Bidirectional models (BERT) omit this.',
    related: ['attention'],
  },
  gini: {
    id: 'gini',
    term: 'Gini impurity',
    short: 'How mixed a node is',
    beginner:
      '0 = pure leaf (all one class). High = jumbled mix. Trees split to make children purer.',
    curious: 'Gini = 1 − Σ p_c². Information gain ≈ parent impurity − weighted child impurity.',
    nerd:
      'CART uses Gini or MSE. Random forests average many high-variance trees to reduce variance.',
    related: ['bootstrap', 'ensemble'],
  },
  bootstrap: {
    id: 'bootstrap',
    term: 'Bootstrap sample',
    short: 'Resample with replacement',
    beginner:
      'Each tree trains on a random bag of the data — some points repeat, some are left out.',
    curious:
      'Out-of-bag (OOB) points estimate error without a separate validation set.',
    nerd:
      'Bagging: train on bootstrap draws, aggregate. RF adds feature randomness at each split.',
    related: ['ensemble', 'gini'],
  },
  ensemble: {
    id: 'ensemble',
    term: 'Ensemble vote',
    short: 'Many models, one answer',
    beginner:
      'Each tree votes for a class; the majority wins — crowd wisdom for algorithms.',
    curious:
      'Reduces variance of unstable learners (deep trees). Bias stays similar to base learners.',
    nerd:
      'Majority vote ≈ mode of p̂_t(y|x). Soft voting averages class probabilities when available.',
    related: ['bootstrap'],
  },
  centroid: {
    id: 'centroid',
    term: 'Centroid',
    short: 'Cluster center of mass',
    beginner:
      'The average position of points in a cluster — like the “middle” of that group.',
    curious:
      'K-means alternates: assign points to nearest centroid, then recompute means.',
    nerd:
      'Minimizes within-cluster sum of squares (inertia). k-means++ improves initialization.',
    related: ['inertia', 'kmeans-pp'],
  },
  inertia: {
    id: 'inertia',
    term: 'Inertia',
    short: 'Total cluster tightness',
    beginner:
      'Sum of squared distances from points to their centroid. Lower = tighter blobs.',
    curious:
      'Always decreases (or stays) each iteration until a local minimum of the objective.',
    nerd:
      'J = Σ_i min_j ‖x_i − μ_j‖². Not convex in assignment+centers jointly; sensitive to k and init.',
    related: ['centroid'],
  },
  'kmeans-pp': {
    id: 'kmeans-pp',
    term: 'k-means++',
    short: 'Smarter starting centers',
    beginner:
      'Picks starting centroids far from each other so clusters don’t all spawn in one blob.',
    curious:
      'First center random; each next one sampled proportional to distance² from nearest center.',
    nerd:
      'Gives O(log k) approximation in expectation for the optimal k-means cost under init.',
    related: ['centroid', 'inertia'],
  },
}

export const LESSONS: Record<AlgorithmId, AlgoLesson> = {
  'gradient-descent': {
    algorithm: 'gradient-descent',
    title: 'Gradient Descent',
    oneLiner: 'Walk downhill on the loss landscape until you stop improving.',
    intuition:
      'Training many models is optimization: pick a starting point, follow the negative gradient, hope you land in a good valley.',
    watchFor: [
      'Learning rate too high → ball overshoots or flies off',
      'Rosenbrock: narrow valley needs tiny η or momentum',
      'Adam often settles faster than vanilla GD on Himmelblau',
    ],
    steps: [
      {
        title: 'Start somewhere',
        body: 'Parameters begin at a random (or chosen) point on the surface.',
        tip: 'Use “Random start” or a Playground preset.',
      },
      {
        title: 'Measure the slope',
        body: 'Compute the gradient — which way is uphill.',
        formula: 'g = ∇f(θ)',
      },
      {
        title: 'Take a step downhill',
        body: 'Move against the gradient, scaled by the learning rate.',
        formula: 'θ ← θ − η g   (or Momentum / Adam)',
      },
      {
        title: 'Repeat',
        body: 'Each step should reduce loss (if η is sane). Watch the amber path.',
        tip: 'Hit Play, then scrub the timeline to inspect intermediate losses.',
      },
    ],
    terms: ['gradient', 'learning-rate', 'adam', 'loss'],
    tryNext: 'Compare Vanilla GD vs Adam on the saddle surface.',
  },
  attention: {
    algorithm: 'attention',
    title: 'Attention',
    oneLiner: 'Every token soft-searches the sequence for what matters.',
    intuition:
      'Transformers don’t hard-wire “look left.” They learn scores between every pair of tokens, then mix information with those weights.',
    watchFor: [
      'Click a query token — arcs lock to that row',
      'Causal mask → lower-triangular heatmap (no future tokens)',
      'Low temperature → spiky, decisive attention',
    ],
    steps: [
      {
        title: 'Embed tokens',
        body: 'Each word becomes a vector (here: synthetic but deterministic).',
      },
      {
        title: 'Project Q, K, V',
        body: 'Linear maps create queries, keys, and values per head.',
        formula: 'Q = XW_Q,  K = XW_K,  V = XW_V',
      },
      {
        title: 'Score & scale',
        body: 'Similarity between every query and key, scaled by √d.',
        formula: 'S = QKᵀ / √dₖ',
      },
      {
        title: 'Softmax → mix values',
        body: 'Weights sum to 1; output is a weighted sum of values.',
        formula: 'Attention = softmax(S) V',
        tip: 'Toggle heads — different subspaces, different patterns.',
      },
    ],
    terms: ['attention', 'softmax', 'temperature', 'causal-mask'],
    tryNext: 'Open the “GPT-style mask” playground preset.',
  },
  'random-forest': {
    algorithm: 'random-forest',
    title: 'Random Forest',
    oneLiner: 'Many random trees vote — the crowd beats any single tree.',
    intuition:
      'One deep tree memorizes noise. Bootstrap many trees, randomize features, then majority-vote for a sturdier classifier.',
    watchFor: [
      'Nodes appear in growth order — pure leaves light up by class',
      'Decision regions fill only after trees finish growing',
      'Feature subset = 1 forces axis-aligned “stumps” of variety',
    ],
    steps: [
      {
        title: 'Bootstrap bag',
        body: 'Each tree draws a sample with replacement from the training set.',
      },
      {
        title: 'Grow with Gini splits',
        body: 'Pick a feature and threshold that purifies child nodes the most.',
        formula: 'Gini = 1 − Σ p_c²',
      },
      {
        title: 'Stop rules',
        body: 'Max depth, min samples, or pure nodes create leaves.',
      },
      {
        title: 'Vote',
        body: 'At prediction time every finished tree votes; majority wins.',
        tip: 'Click the scatter plot to inspect ensemble votes.',
      },
    ],
    terms: ['gini', 'bootstrap', 'ensemble'],
    tryNext: 'Try “XOR axe-cuts” — axis splits vs checker pattern.',
  },
  kmeans: {
    algorithm: 'kmeans',
    title: 'K-Means',
    oneLiner: 'Guess k centers, assign points, move centers — repeat.',
    intuition:
      'Unsupervised clustering: no labels. We invent k “prototypes” and partition space into nearest-centroid regions (Voronoi).',
    watchFor: [
      'Inertia should drop each iteration',
      'Empty clusters keep their old centroid',
      'Moons are non-convex — k-means struggles (that’s the lesson!)',
    ],
    steps: [
      {
        title: 'Initialize (k-means++)',
        body: 'Spread initial centroids so they don’t all spawn in one blob.',
      },
      {
        title: 'Assign',
        body: 'Each point joins the nearest centroid.',
        formula: 'c(x) = argmin_j ‖x − μ_j‖²',
      },
      {
        title: 'Update',
        body: 'Move each centroid to the mean of its members.',
        formula: 'μ_j = mean{ x : c(x)=j }',
      },
      {
        title: 'Converge',
        body: 'Stop when centers barely move or max iterations hit.',
        tip: 'Scrub the iteration slider to scrub history.',
      },
    ],
    terms: ['centroid', 'inertia', 'kmeans-pp'],
    tryNext: 'Run “K-Means vs moons” to see a classic failure mode.',
  },
}

export function difficultyLabel(d: Difficulty): string {
  if (d === 'beginner') return 'Beginner'
  if (d === 'curious') return 'Curious'
  return 'Nerd'
}

export function glossaryBlurb(term: GlossaryTerm, d: Difficulty): string {
  return term[d]
}
