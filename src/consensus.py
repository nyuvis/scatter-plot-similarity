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
from sklearn.manifold import MDS
from sklearn.cluster import AgglomerativeClustering

def process(groups_arr):
  ids = set()
  matrix = {}
  max_dist = 0
  for ga in groups_arr:
    if not len(ga['groups']):
      continue
    max_dist += 1
    cur_matrix = {}
    max_counts = {}
    for groups in ga['groups']:
      if groups['name'].strip().lower().startswith('distinct'):
        continue
      clusters = [ g['id'] for g in groups['plots'] ]
      for a in clusters:
        if a not in max_counts:
          max_counts[a] = 0
        max_counts[a] += 1
        for b in clusters:
          if a == b:
            continue
          ra = a
          rb = b
          if ra > rb:
            rb, ra = ra, rb
          if ra not in cur_matrix:
            cur_matrix[ra] = {}
          if rb not in cur_matrix[ra]:
            cur_matrix[ra][rb] = 0
          cur_matrix[ra][rb] += 1
    for a, row in cur_matrix.items():
      ids.add(a)
      for b, v in row.items():
        ids.add(b)
        distance = 1 - v / min(max_counts[a], max_counts[b]) # TODO back to 2 -
        if a not in matrix:
          matrix[a] = {}
        if b not in matrix[a]:
          matrix[a][b] = 0
        matrix[a][b] += distance
  norm_max_dist = 100.0
  result = {}
  for a in ids:
    result[a] = {}
    for b in ids:
      if a == b:
        result[a][b] = 0
        continue
      ra = a
      rb = b
      if ra > rb:
        rb, ra = ra, rb
      result[a][b] = matrix[ra][rb] / max_dist * norm_max_dist if ra in matrix and rb in matrix[ra] else norm_max_dist
  ids = list(ids)
  ids.sort()
  return ids, result

def output_matrix(out, ids, result):
  ids = ids[:]
  ids.insert(0, 'Name')
  writer = csv.DictWriter(out, fieldnames=ids)
  writer.writeheader()
  for id in ids:
    if id == 'Name':
      continue
    row = copy.copy(result[id])
    row['Name'] = id
    writer.writerow(row)

def output_projection(out, ids, result):
  X = np.zeros((len(ids), len(ids)))
  for (a, aid) in enumerate(ids):
    for (b, bid) in enumerate(ids):
      X[a,b] = 2*result[aid][bid]
  model = MDS(n_components=2, random_state=0, dissimilarity="precomputed")
  proj = model.fit_transform(X)
  writer = csv.DictWriter(out, fieldnames=['id', 'x', 'y'])
  writer.writeheader()
  for (ix, row) in enumerate(proj):
    writer.writerow({
      'id': ids[ix],
      'x': row[0],
      'y': row[1]
    })

def output_cluster(out, ids, result):
  X = np.zeros((len(ids), len(ids)))
  for (a, aid) in enumerate(ids):
    for (b, bid) in enumerate(ids):
      X[a,b] = result[aid][bid]
  print(",".join(ids), file=out)
  for nc in range(20, 21):
    clustering = AgglomerativeClustering(n_clusters=nc, affinity="precomputed", linkage="complete").fit(X)
    labels = list(clustering.labels_)
    print(",".join(str(v) for v in labels), file=out)

def usage():
  print("""
usage: {0} [-h] -- <matrix> <projection> <clustering>
-h: print help
<matrix>: the file for the result matrix
<projection>: the file for the result projection
<clustering>: the file for the result clustering
Reads a JSON list with groups from STDIN
""".strip().format(sys.argv[0]), file=sys.stderr)
  exit(1)

if __name__ == "__main__":
  args = sys.argv[:]
  args.pop(0)
  while args:
    arg = args.pop(0)
    if arg == '-h':
      usage()
    elif arg == '--':
      break
    else:
      print("no arguments!", file=sys.stderr)
      usage()
  if len(args) != 3:
    print("require three more arguments", file=sys.stderr)
    usage()
  out_matrix = args[0]
  out_proj = args[1]
  out_cluster = args[2]
  lines = sys.stdin.read().replace('}{', '},{').rstrip().split('\n')
  json_string = '[' + ','.join(lines) + ']'
  groups = json.loads(json_string)
  # groups = json.loads(sys.stdin.read())
  ids, result = process(groups)
  with open(out_matrix, 'w') as out:
    output_matrix(out, ids, result)
  with open(out_proj, 'w') as out:
    output_projection(out, ids, result)
  with open(out_cluster, 'w') as out:
    output_cluster(out, ids, result)
