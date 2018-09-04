# -*- coding: utf-8 -*-
# -*- mode: python; -*-
"""exec" "`dirname \"$0\"`/call.sh" "$0" "$@";" """
from __future__ import print_function
from __future__ import division

__doc__ = ""

from flask import Flask
from flask import request

import os
import sys
import json
import random
import threading
import traceback
import hashlib

from time import time

# general function to write CSV
quote = '"'
delim = ','
def doQuote(cell):
  cell = str(cell)
  if cell.find(delim) < 0 and cell.find(quote) < 0:
      return cell
  return  quote + cell.replace(quote, quote + quote) + quote

rand_lock = threading.RLock()

app = Flask(__name__)
img_path = None
quest_file = None
cat_file = None
img_map = {}

postfix = '.png'
def valid_images():
  valid = []
  for (dirpath, _dirnames, filenames) in os.walk(img_path, False):
    for f in filenames:
      if f.endswith(postfix):
        img = os.path.join(dirpath, f)
        name = hashlib.sha1(img.encode('utf-8')).hexdigest()
        img_map[name] = img
        valid.append(name)
  return valid

@app.route("/api/images")
@app.route("/api/images/<name>")
def get_image(name = None):
  if name is None:
    valid = valid_images()
    return json.dumps({
      'images': valid
    })
  image = img_map[name]
  with open(image, 'rb') as f:
    return f.read()

@app.route("/api/order/", methods=[ 'POST' ])
def order():
  post = request.get_json()
  images = post['images']
  method = post['method']
  order = [ ix for ix, _ in enumerate(images) ]
  if method == 'random':
    try:
      rand_lock.acquire()
      random.shuffle(order)
    finally:
      rand_lock.release()
  elif method == 'none':
    pass
  elif method == 'name':
    order.sort(key=lambda ix: images[ix])
  elif method == 'foo': # TODO replace with real method name
    # TODO this is a stub to show how to do it

    def distance(a, b):
      # TODO images[a] would be the name of the image
      return (a - b)*(a - b)

    new_order = [ order.pop(0) ]
    while order:
      min_dist = None
      min_ix = None
      cur = new_order[-1]
      for o in order:
        d = distance(cur, o)
        if d < min_dist or min_dist is None:
          min_dist = d
          min_ix = o
      order = [ o for o in order if o != min_ix ]
      new_order.append(min_ix)
    order = new_order
  else:
    raise ValueError("unknown method: {0}".format(method))
  return json.dumps({
    "order": order
  })

@app.route("/api/result/", methods=[ 'POST' ])
def result():
  plots = request.get_json()
  groups = [ {
    "name": g["name"],
    "plots": [ {
      "id": img_map[p["id"]],
      "pos": p["pos"]
    } for p in g["plots"] ]
  } for g in plots['groups'] ]
  log_c(uid=plots['uid'], groups=groups)
  print(json.dumps(groups))
  return json.dumps({
    "msg": "success!"
  })

start = time()
log_lock = threading.RLock()
def log_quest(uid, cur, images=[], choice=[]):
  if quest_file is None:
    return
  elapsed = time() - start
  try:
    log_lock.acquire()
    with open(quest_file, 'a') as f:
      if len(images) != 3:
        images = ["", "", ""]
      else:
        images = [ img_map[img] for img in images ]
      if len(choice) != 2:
        choice = ["", ""]
      row = [
        elapsed, # time
        uid, # uid
        cur, # cur
        images[0], # image0
        images[1], # image1
        images[2], # image2
        choice[0], # choice0
        choice[1]  # choice1
      ]
      print(delim.join(map(doQuote, row)), file=f)
  finally:
    log_lock.release()

def log_c(uid, groups):
  if cat_file is None:
    return
  elapsed = time() - start
  try:
    log_lock.acquire()
    with open(cat_file, 'a') as f:
      json.dump({
        'uid': uid,
        'time': elapsed,
        'groups': groups
      }, f, sort_keys=True)
  finally:
    log_lock.release()

def init_clog():
  if cat_file is None:
    return
  try:
    log_lock.acquire()
    with open(cat_file, 'w') as f: # truncates
      pass
    log_c(uid=0, groups=[]) # mark new server start
  finally:
    log_lock.release()

header = ["time", "uid", "cur", "image0", "image1", "image2", "choice0", "choice1"]
def init_log():
  if quest_file is None:
    return
  try:
    log_lock.acquire()
    need_header = not os.path.exists(quest_file) or os.path.getsize(quest_file) == 0
    if need_header:
      with open(quest_file, 'w') as f: # truncates
        print(delim.join(map(doQuote, header)), file=f)
    else:
      log_quest(uid=0, cur=0) # mark new server start
  finally:
    log_lock.release()

qobj = {
  "cur_uid": 1
}
uid_lock = threading.RLock()
def get_uid():
  try:
    uid_lock.acquire()
    uid = qobj['cur_uid']
    qobj['cur_uid'] += 1
  finally:
    uid_lock.release()
  return uid

@app.route("/api/get_uid")
def api_get_uid():
  uid = get_uid()
  log_c(uid=uid, groups=[])
  return json.dumps({
    "uid": uid
  })

max_questions = 10
@app.route("/api/question")
@app.route("/api/question/<uid>/<cur>/")
def question(uid = 0, cur = 0):
  uid = int(uid)
  cur = int(cur)
  if uid == 0:
    uid = get_uid()
    log_quest(uid=uid, cur=0)
    return json.dumps({
      "uid": uid,
      "cur": 0,
      "total": max_questions
    })
  if cur >= max_questions:
    log_quest(uid=uid, cur=max_questions)
    return json.dumps({
      "uid": uid,
      "cur": cur,
      "total": max_questions
    })
  images = valid_images()
  try:
    rand_lock.acquire()
    random.seed(uid * 31 * 31 + cur * 31 + 7717)
    random.shuffle(images)
  finally:
    rand_lock.release()
  images = images[:3]
  log_quest(uid=uid, cur=cur, images=images)
  return json.dumps({
    "uid": uid,
    "cur": cur,
    "total": max_questions,
    "images": images
  })

@app.route("/api/answer/<uid>/<cur>/", methods=[ 'POST' ])
def answer(uid = 0, cur = 0):
  uid = int(uid)
  cur = int(cur)
  post = request.get_json()
  images = post["images"]
  choice = post["choice"]
  if len(choice) == 2 and (choice[0] != 0 or choice[1] == 0):
    raise ValueError("answer invalid! {0}".format(repr(choice)))
  log_quest(uid=uid, cur=cur, images=images, choice=choice)
  return json.dumps({
    "uid": uid,
    "next_cur": cur + 1
  })

@app.errorhandler(Exception)
def all_exception_handler(error):
  print(traceback.format_exc(), file=sys.stderr)
  return 'Internal Server Error', 500

def usage():
  print("""
usage: {0} [-h] [--log-q <log file>] <img folder>
-h: print help
--log-q <log file>: specifies the questionnaire log file
--log-c <log file>: specifies the plots log file
<img folder>: specifies the image folder
""".strip().format(sys.argv[0]), file=sys.stderr)
  exit(1)

if __name__ == "__main__":
  args = sys.argv[:]
  args.pop(0)
  while args:
    arg = args.pop(0)
    if arg == '-h':
      usage()
    elif arg == '--log-q':
      if not args:
        print("--log-q requires argument", file=sys.stderr)
        usage()
      quest_file = args.pop(0)
      init_log()
    elif arg == '--log-c':
      if not args:
        print("--log-c requires argument", file=sys.stderr)
        usage()
      cat_file = args.pop(0)
      init_clog()
    else:
      img_path = arg
  if img_path is None:
    print("require image path", file=sys.stderr)
    usage()
  app.run()
