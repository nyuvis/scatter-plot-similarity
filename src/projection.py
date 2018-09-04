# -*- coding: utf-8 -*-
# -*- mode: python; -*-
"""exec" "`dirname \"$0\"`/call.sh" "$0" "$@";" """
from __future__ import print_function
from __future__ import division

__doc__ = ""

import os
import csv
import sys
import copy
import json

import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import MDS
from sklearn.cluster import AgglomerativeClustering
from scipy.spatial.distance import pdist
from scipy.spatial.distance import squareform
from scipy.stats import pearsonr

def compute_scatterplot(ids, rows, owns):
  X = np.zeros((len(ids), len(rows[0])))
  for (ix, row) in enumerate(rows):
    for (col, v) in enumerate(row):
      X[ix, col] = float(v)
  D_scag = pdist(X, 'euclidean')
  D_own = np.zeros((len(ids), len(ids)))
  for (aix, aid) in enumerate(ids):
    for (bix, bid) in enumerate(ids):
      D_own[aix, bix] = float(owns[aid][bid])
  D_own = squareform(D_own)
  plt.scatter(np.asarray(D_own).flatten(), np.asarray(D_scag).flatten())
  plt.draw()
  plt.savefig('scatterplot.png', dpi=100)
  #plt.show()
  print("Pearson correlation: " + str(pearsonr(np.asarray(D_own).flatten(), np.asarray(D_scag).flatten())[0]))

def output_projection(out, ids, rows):
  X = np.zeros((len(ids), len(rows[0])))
  for (ix, row) in enumerate(rows):
    for (col, v) in enumerate(row):
      X[ix,col] = float(v)
  model = MDS(n_components=2, random_state=0, dissimilarity="euclidean")
  proj = model.fit_transform(X)
  writer = csv.DictWriter(out, fieldnames=['id', 'x', 'y'])
  writer.writeheader()
  for (ix, row) in enumerate(proj):
    writer.writerow({
      'id': ids[ix],
      'x': row[0],
      'y': row[1]
    })

def output_cluster(out, ids, rows):
  X = np.zeros((len(ids), len(rows[0])))
  for (ix, row) in enumerate(rows):
    for (col, v) in enumerate(row):
      X[ix,col] = float(v)
  print(",".join(ids), file=out)
  for nc in range(20, 21):
    clustering = AgglomerativeClustering(n_clusters=nc, affinity="euclidean", linkage="complete").fit(X)
    labels = list(clustering.labels_)
    print(",".join(str(v) for v in labels), file=out)

if __name__ == "__main__":
  with open('../data/scags.csv', 'r') as input:
    keys = None
    ids = []
    rows = []
    for row in csv.DictReader(input):
      if keys is None:
        keys = [ k for k in row.keys() if k != 'file' and k != 'group' ]
      rows.append([ row[k] for k in keys ])
      ids.append(row['file'])
    with open('../results/projection_scags.csv', 'w') as out:
      output_projection(out, ids, rows)
    with open('../results/clustering_scags.csv', 'w') as out:
      output_cluster(out, ids, rows)
    try:
        with open('../results/matrix_empirical.csv', 'r') as matrix:
          m = {}
          for r in csv.DictReader(matrix):
            cur_id = r['Name']
            m[cur_id] = {}
            for (k, v) in r.items():
              if k == 'Name':
                continue
              m[cur_id][k] = v
          compute_scatterplot(ids, rows, m)
    except FileNotFoundError:
        print("results/matrix_empirical.csv not found. "
        "Skipped calculation of correlation scag-empirical.")
