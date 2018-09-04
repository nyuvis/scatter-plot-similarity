# Towards Understanding Human Similarity Perception in the Analysis of Large Sets of Scatter Plots

Authors: Anshul Vikram Pandey, Josua Krause, Cristian Felix, Jeremy Boy, and Enrico Bertini

[Paper](https://nyu-staging.pure.elsevier.com/en/publications/towards-understanding-human-similarity-perception-in-the-analysis)

![Showing all 247 plots used in the studies, grouped into 20 clusters extracted using hierarchical clustering approach. The plots propagate from left-to-right, top-to-bottom. Each cluster is assigned a unique ID.](/results/figure5_paper.png "Showing all 247 plots used in the studies, grouped into 20 clusters extracted using hierarchical clustering approach. The plots propagate from left-to-right, top-to-bottom. Each cluster is assigned a unique ID.")

## Results

- `matrix_empirical.csv` - a distance matrix for the 247 scatterplots used in the study. Empirical distances were computed from the spatial arrangements performed by study participants (see `src/consensus.py` and `data/all.json`).

- `clustering_[empirical|scags].csv` - hierarchical clustering results. Scagnostics clusters were computed from scagnostics scores (see `data/scags.csv`). Empirical clusters used the distance matrix above.

- `projection_[empirical|scags].csv` - MDS projections onto the 2D place.


## Data Collection and Processing

### Setup

Assuming you have Python 3 installed:

```
virtualenv -p python3 env
source env/bin/activate
pip install -r requirements.txt
```

### Data Collection

To run the spatial arrangement interface:

```
cd src/
python server.py ../plots/
```

Then type `http://127.0.0.1:5000/static/index.html` in your browser.

After the study is finished a JSON file will be printed to the console.

### Processing

Generate clustering and projection based on empirical data:

```
cd src/
cat ../data/all.json | python consensus.py -- ../results/matrix_empirical.csv ../results/projection_empirical.csv ../results/clustering_empirical.csv
```

Do the same but now for scagnostics:

```
python projection.py
```

Generate MDS projections (ignore the warnings):

```
python project_plots.py
```

Check the folder `results` for output.

![MDS projection of scatterplots](/results/projected_empirical_empirical.png "MDS projection of scatterplots")

### Troubleshooting

If matlplotlib throws the error below, follow [this solution](https://stackoverflow.com/a/35107136/1253334).

```
RuntimeError: Python is not installed as a framework. The Mac OS X backend will not be able to function correctly if Python is not installed as a framework. See the Python documentation for more information on installing Python as a framework on Mac OS X. Please either reinstall Python as a framework, or try one of the other backends. If you are using (Ana)Conda please install python.app and replace the use of 'python' with 'pythonw'. See 'Working with Matplotlib on OSX' in the Matplotlib FAQ for more information.
```
