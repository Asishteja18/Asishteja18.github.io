# AI-90 day index (30 Python · 30 ML · 30 AI from scratch)

Full content: AI90_MASTER.md (one file: notes, visuals, code, tests, solutions, runner). 307/307 tests verified 2026-11-17.

| Day | Block | Topic | Dataset |
| --- | --- | --- | --- |
| 1 | Python | Setup, variables and types | none — pure Python |
| 2 | Python | Strings | none — pure Python |
| 3 | Python | Conditionals | none — pure Python |
| 4 | Python | Loops | none — pure Python |
| 5 | Python | Lists and tuples | none — pure Python |
| 6 | Python | Dicts and sets | none — pure Python |
| 7 | Python | Project: CLI expense tracker | your own expenses |
| 8 | Python | Functions in depth | none — pure Python |
| 9 | Python | Files, CSV and JSON | files you create |
| 10 | Python | Errors and debugging | none — pure Python |
| 11 | Python | Modules and the standard library | none — pure Python |
| 12 | Python | Comprehensions, generators, lambda | none — pure Python |
| 13 | Python | Classes: a Vector | none — pure Python |
| 14 | Python | Dataclasses, type hints, testing | none — pure Python |
| 15 | Python | Capstone: Matrix library | none — pure Python |
| 16 | Python | CLI tools: argparse and logging | none |
| 17 | Python | File automation: the folder organiser | a messy test folder (made by the tests) |
| 18 | Python | Regular expressions: log parser | web-server access logs (Common Log Format). Real one to try after: the NASA-HTTP July 1995 log (search "NASA HTTP access log 1995"). |
| 19 | Python | HTTP APIs and JSON: live weather | Open-Meteo live forecast API (free, no key): `https://api.open-meteo.com/v1/forecast?latitude=52.08&longitude=0.01&hourly=temperature_2m` |
| 20 | Python | Web scraping | books.toscrape.com (a site built for scraping practice) |
| 21 | Python | Scheduling and idempotent jobs | your Day 19 weather data, appended hourly |
| 22 | Python | Real dataset #1: Titanic, by hand | Titanic passengers (891 rows) |
| 23 | Python | NumPy on a real dataset: Iris | Iris (150 flowers × 4 measurements, 3 species) |
| 24 | Python | Pandas on real data: cleaning Titanic | Titanic (via Day 22's `download`) |
| 25 | Python | Visualising data with Matplotlib | Iris + Titanic |
| 26 | Python | Spreadsheet automation: Excel reports | Flights — monthly airline passengers 1949–1960 (`download("flights")`) |
| 27 | Python | A reusable data-cleaning pipeline | Titanic (raw) |
| 28 | Python | Git + GitHub Actions: run jobs in the cloud | none |
| 29 | Python | The data-collector bot | live weather (Day 19) appended over days → your own growing time series |
| 30 | Python | Block 1 capstone: automatic EDA report generator | run it on Titanic, Iris and Flights — any CSV |
| 31 | ML | Vectors and matrices for ML | Iris (bundled) |
| 32 | ML | Derivatives and gradients | none (functions) |
| 33 | ML | Gradient descent | none (a 2-D bowl), then real data from Day 37 on |
| 34 | ML | Probability and statistics for ML | Wine (bundled) |
| 35 | ML | The ML workflow: splits, baselines, metrics | Diabetes progression (442 patients, 10 features) |
| 36 | ML | Linear regression: the closed-form solution | Diabetes |
| 37 | ML | Linear regression with gradient descent (mini-batch) | Diabetes (standardised) |
| 38 | ML | Overfitting: polynomial features and ridge regression | Car MPG (`download("mpg")`) for the real run; synthetic sine for tests |
| 39 | ML | Logistic regression | Breast Cancer Wisconsin (569 tumours, 30 features) |
| 40 | ML | Classification metrics | Breast Cancer predictions from Day 39 |
| 41 | ML | Softmax regression (multi-class) | Wine (178 wines, 3 cultivars, 13 chemical features) |
| 42 | ML | Cross-validation | Wine + Diabetes |
| 43 | ML | k-Nearest Neighbours | Iris + Wine |
| 44 | ML | Naive Bayes: an SMS spam filter | SMS Spam Collection (5,572 real texts) |
| 45 | ML | Decision trees | Iris, then Titanic |
| 46 | ML | Random forests | Breast Cancer |
| 47 | ML | k-means clustering | Iris without labels (then check against the real species) |
| 48 | ML | PCA: compressing 64 pixels into 2 | Digits (1,797 handwritten 8×8 images) |
| 49 | ML | Feature engineering: Titanic → model-ready matrix | Titanic |
| 50 | ML | scikit-learn pipelines and grid search | Titanic |
| 51 | ML | Project: Titanic, your models vs scikit-learn | Titanic |
| 52 | ML | Gradient boosting from scratch | Diabetes |
| 53 | ML | Imbalanced data and decision thresholds | Breast Cancer, artificially made rare (keep 10% of malignant cases) |
| 54 | ML | Time series: forecasting airline passengers | Flights 1949–1960 (144 months) — and later your own Day 29 weather CSV |
| 55 | ML | Text as numbers: bag-of-words and TF-IDF | SMS Spam |
| 56 | ML | Saving models and serving predictions | your Day 39 breast-cancer model |
| 57 | ML | Learning curves: diagnosing bias vs variance | Digits |
| 58 | ML | Project: predicting car fuel efficiency | Car MPG (398 cars, 1970–82) |
| 59 | ML | Explaining models: permutation importance | Car MPG / Titanic |
| 60 | ML | Block 2 capstone: `minisklearn` benchmark | Iris, Wine, Breast Cancer, Digits |
| 61 | AI | The perceptron | logic gates; then Iris setosa vs rest |
| 62 | AI | Multi-layer networks: the forward pass | XOR |
| 63 | AI | Backpropagation by hand | XOR, then Breast Cancer |
| 64 | AI | Autograd, part 1: a scalar engine | none |
| 65 | AI | A neural-net library on your scalar engine | two moons (`sklearn.datasets.make_moons`, 100 points) |
| 66 | AI | Autograd, part 2: the Tensor engine | none (gradient checks) |
| 67 | AI | Autograd, part 3: the ops a language model needs | none (gradient checks) |
| 68 | AI | `nn.Module`: layers on your engine | Digits (8×8 handwritten, 1,797 images) |
| 69 | AI | Optimisers: SGD, momentum, Adam | a quadratic; Digits |
| 70 | AI | LayerNorm and Dropout | none (gradient checks) |
| 71 | AI | A reusable trainer: batches, early stopping, checkpoints | Digits |
| 72 | AI | Convolution from scratch | Digits as 1×8×8 images |
| 73 | AI | Language model #1: bigram counts | 32,033 real first names |
| 74 | AI | Language model #2: embeddings + MLP (Bengio 2003) | names |
| 75 | AI | Preparing text for a GPT: tokenizer and batches | Tiny Shakespeare (1.1 M characters) |
| 76 | AI | Self-attention, step by step (NumPy) | toy matrices |
| 77 | AI | Causal multi-head attention as a trainable layer | none (gradient checks) |
| 78 | AI | The transformer block | none |
| 79 | AI | GPT: the whole model | none (shape + initial-loss checks) |
| 80 | AI | Train your GPT | Tiny Shakespeare |
| 81 | AI | Generating text: temperature, top-k, top-p | your trained Shakespeare GPT |
| 82 | AI | A BPE tokenizer from scratch | Tiny Shakespeare; test with English + Telugu + emoji |
| 83 | AI | Training like the pros: evaluation, clipping, schedules | Shakespeare train/val |
| 84 | AI | Your own corpus, pretraining and checkpoints | YOUR text — notes, dev log, lecture notes, public-domain books, or a Telugu–English mix |
| 85 | AI | Turning it into a chat model (supervised fine-tuning) | a small chat set you write (≥ 50 Q&A pairs about Python/ML — you know the material now) |
| 86 | AI | RAG from scratch: give your AI a memory | this syllabus file + your dev log (chunked) |
| 87 | AI | Tool use: let the AI run your automations | tools built from Blocks 1–2 (calculator, Titanic stats, dataset downloader) |
| 88 | AI | Serving your AI: an API and a chat page | your chat model (Day 85) |
| 89 | AI | Evaluation and the model card | an eval set you write (30+ prompts with expected answers) |
| 90 | AI | Demo day: ship it | everything |